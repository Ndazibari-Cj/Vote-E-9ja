import React from 'react';
import './Hero.css'

const Hero =()=>{
    return(
        <div className="hero-container">
            <a href="#" className='Register-link'>Register Now ↓</a>
            <div className='button-div'>
                <button className="Admin-button">Admin</button>
                <button className="participant-button">Participant</button>
            </div>
            
        </div>
    );
}
export default Hero;