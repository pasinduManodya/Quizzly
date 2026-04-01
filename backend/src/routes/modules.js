const express = require('express');
const Module = require('../models/Module');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all modules for the user (tree structure)
router.get('/', auth, async (req, res) => {
  try {
    const tree = await Module.getModuleTree(req.user._id);
    res.json(tree);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Failed to fetch modules' });
  }
});

// Get all modules (flat list)
router.get('/flat', auth, async (req, res) => {
  try {
    const modules = await Module.find({ user: req.user._id })
      .populate('parentModule', 'name')
      .sort({ order: 1, name: 1 });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Failed to fetch modules' });
  }
});

// Get a specific module with its children
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('parentModule', 'name');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const children = await Module.find({
      parentModule: module._id,
      user: req.user._id
    }).sort({ order: 1, name: 1 });

    const documents = await Document.find({
      module: module._id,
      user: req.user._id
    }).sort({ uploadedAt: -1 });

    res.json({
      ...module.toObject(),
      children,
      documents,
      documentCount: documents.length
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Failed to fetch module' });
  }
});

// Create a new module
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, parentModule, color, icon } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Module name is required' });
    }

    // Verify parent module exists and belongs to user
    if (parentModule) {
      const parent = await Module.findOne({
        _id: parentModule,
        user: req.user.userId
      });

      if (!parent) {
        return res.status(404).json({ message: 'Parent module not found' });
      }
    }

    // Check for duplicate name in the same parent
    const existing = await Module.findOne({
      name: name.trim(),
      parentModule: parentModule || null,
      user: req.user._id
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'A module with this name already exists in this location' 
      });
    }

    const module = new Module({
      name: name.trim(),
      description: description || '',
      parentModule: parentModule || null,
      user: req.user._id,
      color: color || '#4361ee',
      icon: icon || 'folder'
    });

    await module.save();
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Failed to create module' });
  }
});

// Update a module
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, parentModule, color, icon, order } = req.body;

    const module = await Module.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Prevent circular references
    if (parentModule && parentModule !== 'null') {
      if (parentModule === req.params.id) {
        return res.status(400).json({ message: 'A module cannot be its own parent' });
      }

      // Check if the new parent is a descendant
      let current = await Module.findById(parentModule);
      while (current) {
        if (current._id.toString() === req.params.id) {
          return res.status(400).json({ 
            message: 'Cannot move a module into its own descendant' 
          });
        }
        if (!current.parentModule) break;
        current = await Module.findById(current.parentModule);
      }

      // Verify parent exists and belongs to user
      const parent = await Module.findOne({
        _id: parentModule,
        user: req.user._id
      });

      if (!parent) {
        return res.status(404).json({ message: 'Parent module not found' });
      }
    }

    if (name !== undefined) module.name = name.trim();
    if (description !== undefined) module.description = description;
    if (parentModule !== undefined) {
      module.parentModule = parentModule === 'null' ? null : parentModule;
    }
    if (color !== undefined) module.color = color;
    if (icon !== undefined) module.icon = icon;
    if (order !== undefined) module.order = order;

    await module.save();
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Failed to update module' });
  }
});

// Delete a module
router.delete('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check if module has children
    const childrenCount = await Module.countDocuments({
      parentModule: module._id
    });

    if (childrenCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete a module that contains sub-modules. Please delete or move the sub-modules first.' 
      });
    }

    // Check if module has documents
    const documentsCount = await Document.countDocuments({
      module: module._id
    });

    if (documentsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete a module that contains documents. Please delete or move the documents first.' 
      });
    }

    await Module.deleteOne({ _id: module._id });
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Failed to delete module' });
  }
});

// Move document to module
router.post('/:id/documents/:documentId', auth, async (req, res) => {
  try {
    const { id: moduleId, documentId } = req.params;

    // Verify module exists and belongs to user (or null for root)
    if (moduleId !== 'null') {
      const module = await Module.findOne({
        _id: moduleId,
        user: req.user._id
      });

      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
    }

    // Verify document exists and belongs to user
    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Update document's module
    document.module = moduleId === 'null' ? null : moduleId;
    await document.save();

    res.json({ message: 'Document moved successfully', document });
  } catch (error) {
    console.error('Error moving document:', error);
    res.status(500).json({ message: 'Failed to move document' });
  }
});

// Get breadcrumb path for a module
router.get('/:id/path', auth, async (req, res) => {
  try {
    const module = await Module.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const path = [];
    let current = module;

    while (current) {
      path.unshift({
        _id: current._id,
        name: current.name,
        color: current.color,
        icon: current.icon
      });

      if (current.parentModule) {
        current = await Module.findById(current.parentModule);
      } else {
        current = null;
      }
    }

    res.json(path);
  } catch (error) {
    console.error('Error fetching module path:', error);
    res.status(500).json({ message: 'Failed to fetch module path' });
  }
});

module.exports = router;
