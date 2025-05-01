import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideBar.css';
import logo from '../Assets/FitNestV2.svg';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src={logo} alt="FitNest Logo" className="logo-image" />
      </div>
      <nav className="nav-links">
        {[
          ['Dashboard','/dashboard'],
          ['Routines','/routines'],
          ['Workouts','/workouts'],
          ['Cardio','/cardio'],
          ['Diet','/diet'],
          ['Progress','/progress'],
          ['Profile','/profile'],
          ['Settings','/settings']
        ].map(([name, to]) => (
          <NavLink 
            to={to} 
            key={name}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
);
}
