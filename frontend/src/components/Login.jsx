import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
        
        try {
            const res = await axios.post(`http://localhost:3000${endpoint}`, { username, password });
            
            // Your controller sends { _id, username, chips, token }
            const { token, ...userData } = res.data;
            onLoginSuccess(userData, token);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="poker-room">
            <form onSubmit={handleSubmit} className="action-tray" style={{ flexDirection: 'column', width: '300px' }}>
                <h2 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>
                    {isRegistering ? 'Register' : 'Login'}
                </h2>
                
                {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}
                
                <input 
                    type="text" 
                    className="raise-input" 
                    style={{ width: 'auto' }}
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    className="raise-input" 
                    style={{ width: 'auto' }}
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                
                <button type="submit" className="action-btn btn-check-call">
                    {isRegistering ? 'Create Account' : 'Enter Casino'}
                </button>
                
                <button 
                    type="button" 
                    className="action-btn btn-raise"
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering ? 'Switch to Login' : 'Switch to Register'}
                </button>
            </form>
        </div>
    );
};

export default Login;