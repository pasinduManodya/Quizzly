import React from 'react';
import { Icon } from '../ui/Icon';

export const ContactInfo: React.FC = () => {
  const contactItems = [
    {
      icon: 'email',
      label: 'Email',
      value: 'pasindumanodya360@gmail.com'
    },
    {
      icon: 'location',
      label: 'Headquarters',
      value: '45 Galle Road, Colombo 03, Sri Lanka'
    },
    {
      icon: 'clock',
      label: 'Response Time',
      value: 'Within 2 hours, Mon–Fri 9am–6pm IST'
    },
    {
      icon: 'message',
      label: 'Education Enquiries',
      value: 'pasindumanodya360@gmail.com'
    }
  ];

  return (
    <div className="ci-list">
      {contactItems.map((item, idx) => (
        <div key={idx} className="ci-item">
          <div className="ci-icon">
            <Icon type={item.icon} />
          </div>
          <div>
            <div className="ci-label">{item.label}</div>
            <div className="ci-val">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
