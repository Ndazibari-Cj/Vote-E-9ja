
import './ContactUs.css'

const Contact =()=> {
    return(
        <div className="contact-container">
            <h1>Contact Us</h1>
            <div className='label-input'>
                <div className='label-input-single'>
                    <label>Full Name: </label>
                    <input type="text" name="name" id="name"/>
                </div>
                <br />
                <div className='label-input-single'>
                    <label>Phone Number:  </label>
                    <input type="number" name="phone-number" id="phone-number" />
                </div>
                <br />
                <div className='label-input-single'>
                    <label>E-mail Address:  </label>
                    <input type="email" name="email" id="email-input"/>
                </div>
                <br />
                <div className='label-input-single2'>
                    <textarea placeholder='Message us here' name="message" id="message" cols="50" rows={10}>Message</textarea>
                </div>
                <br />
                <button className="submit-button">Submit</button>
            </div>
            <p>If you have any questions or feedback, feel free to reach out to us at: </p>
            <p>Whatsapp: +23467564980</p>
            <p>Or click <a href="mailto:cjndazibari@gmail.com">here</a> to send us an email directly.</p>

        </div>
        );

}
export default Contact;