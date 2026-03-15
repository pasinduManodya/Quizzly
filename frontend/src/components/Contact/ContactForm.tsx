import React, { useState } from 'react';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string): boolean => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim().length > 0;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'subject':
        return value.length > 0;
      case 'message':
        return value.trim().length >= 10;
      default:
        return true;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const sendEmail = async (data: typeof formData) => {
    const subject = encodeURIComponent(`Quizzly Contact: ${data.subject}`);
    const body = encodeURIComponent(
      `Name: ${data.firstName} ${data.lastName}\n` +
      `Email: ${data.email}\n` +
      `Subject: ${data.subject}\n\n` +
      `Message:\n${data.message}`
    );
    
    const mailtoLink = `mailto:pasindumanodya360@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      if (!validateField(key, formData[key as keyof typeof formData])) {
        newErrors[key] = true;
      }
    });

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        await sendEmail(formData);
        
        setShowSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: ''
        });
        setTimeout(() => setShowSuccess(false), 6000);
      } catch (error) {
        console.error('Error sending email:', error);
        alert('There was an error sending your message. Please try again or email directly to pasindumanodya360@gmail.com');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="form-card reveal d2">
      <div className="form-card-ttl">Send us a message</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="fg">
            <label className="flbl" htmlFor="firstName">First name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className={`ff ${errors.firstName ? 'err' : ''}`}
              placeholder="Jane"
              value={formData.firstName}
              onChange={handleChange}
            />
            <div className={`ferr ${errors.firstName ? 'show' : ''}`}>
              Please enter your first name.
            </div>
          </div>
          
          <div className="fg">
            <label className="flbl" htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className={`ff ${errors.lastName ? 'err' : ''}`}
              placeholder="Smith"
              value={formData.lastName}
              onChange={handleChange}
            />
            <div className={`ferr ${errors.lastName ? 'show' : ''}`}>
              Please enter your last name.
            </div>
          </div>
        </div>
        
        <div className="fg">
          <label className="flbl" htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            className={`ff ${errors.email ? 'err' : ''}`}
            placeholder="jane@example.com"
            value={formData.email}
            onChange={handleChange}
          />
          <div className={`ferr ${errors.email ? 'show' : ''}`}>
            Please enter a valid email address.
          </div>
        </div>
        
        <div className="fg">
          <label className="flbl" htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            className={`ff ${errors.subject ? 'err' : ''}`}
            value={formData.subject}
            onChange={handleChange}
          >
            <option value="">Select a topic</option>
            <option>General Enquiry</option>
            <option>Technical Support</option>
            <option>Teams &amp; Education</option>
            <option>Billing</option>
            <option>Partnership</option>
          </select>
          <div className={`ferr ${errors.subject ? 'show' : ''}`}>
            Please select a subject.
          </div>
        </div>
        
        <div className="fg">
          <label className="flbl" htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            className={`ff ${errors.message ? 'err' : ''}`}
            placeholder="Tell us how we can help…"
            value={formData.message}
            onChange={handleChange}
          />
          <div className={`ferr ${errors.message ? 'show' : ''}`}>
            Please write a message (min. 10 characters).
          </div>
        </div>
        
        <button type="submit" className="fsub" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send message'}
          <svg viewBox="0 0 15 15">
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 7.5h13M9 3l5 4.5L9 12"/>
          </svg>
        </button>
        
        <div className={`f-ok ${showSuccess ? 'show' : ''}`}>
          Your message has been sent. We'll be in touch shortly.
        </div>
      </form>
    </div>
  );
};
