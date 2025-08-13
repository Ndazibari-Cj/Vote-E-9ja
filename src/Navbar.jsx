
//https://cdn-icons-png.flaticon.com/512/107/107831.png
import logo from './assets/Images/logo.jpeg';
import React from 'react';
const Navbar=()=>{
    const handleHamburgerClick = () => {
        const navLinks = document.querySelector('.nav-bar-links');
        navLinks.classList.toggle('active');
    };
    return(
        <nav>
            <div className="logo-div">
                <h3> <span className='v-span'>V</span>ote-E-9ja</h3>
            </div>
            <div className='hamburger' onClick={handleHamburgerClick}>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className='nav-bar-links'>
                <a href='#'>Home</a>
                <a href='About.jsx'>About</a>
                <a href='#'>Register</a>
                <a href='#'>Contact Us</a>
                <a href='#'>Settings</a>
            <div className='button-div'>
                <button className='sign-up-button'>Sign Up</button>
            </div>
            </div>
        </nav>
    );

}
export default Navbar;