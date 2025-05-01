import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './TopBar.css';
import usericon from '../Assets/usericon.svg';

export default function TopBar() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="spacer" />
      <div className="user-circle" onClick={() => setOpen(o => !o)}>
        <img src={usericon} alt="User" className="user-avatar" />
        {open && (
          <div className="user-dropdown">
            <div className="dropdown-item" onClick={() => navigate('/profile')}>
              Profile
            </div>
            <div className="dropdown-item" onClick={logout}>
              Sign Out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
