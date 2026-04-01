const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  parentModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: '#4361ee'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

moduleSchema.index({ user: 1, parentModule: 1 });
moduleSchema.index({ user: 1, name: 1 });

moduleSchema.methods.getPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parentModule) {
    current = await mongoose.model('Module').findById(current.parentModule);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' / ');
};

moduleSchema.statics.getModuleTree = async function(userId, parentId = null) {
  const Document = mongoose.model('Document');
  
  const modules = await this.find({ 
    user: userId, 
    parentModule: parentId 
  }).sort({ order: 1, name: 1 });
  
  const tree = [];
  for (const module of modules) {
    const children = await this.getModuleTree(userId, module._id);
    
    // Get documents for this module
    const documents = await Document.find({
      module: module._id,
      user: userId
    })
    .select('_id title filename uploadedAt')
    .sort({ uploadedAt: -1 });
    
    tree.push({
      ...module.toObject(),
      children,
      documents: documents || [],
      documentCount: documents.length
    });
  }
  
  return tree;
};

module.exports = mongoose.model('Module', moduleSchema);
