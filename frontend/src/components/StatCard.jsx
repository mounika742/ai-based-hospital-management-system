import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = '#0284c7', bgLight = '#e0f2fe' }) => {
  return (
    <div
      className="stat-card"
      style={{ '--card-accent': color, '--icon-bg': bgLight, '--icon-color': color }}
    >
      <div className="stat-icon">
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-trend">{subtitle}</div>}
      </div>
    </div>
  );
};
