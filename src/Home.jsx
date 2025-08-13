
import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import ContactUs from './ContactUs';
import Footer from './Footer';

const Home=()=>{
    return(
        <>
        <Navbar></Navbar>
        <Hero></Hero>
        <About></About>
        <ContactUs></ContactUs>
        <Footer></Footer>

        </>


    );
 
}
export default Home;