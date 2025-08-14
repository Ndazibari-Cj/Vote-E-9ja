const SignUp =()=> {
    return(
        <div className="SignUp-container">
            <h1>Sign Up</h1>
            <label htmlFor="first-name-sign-up">First Name</label>
            <input type="text" placeholder="Enter your first Name" />
            <label htmlFor="Last-name-sign-up">Last Name</label>
            <input type="text" placeholder="Enter your Last Name" />
            <label htmlFor="surname-sign-up">Surname</label>
            <input type="text" placeholder="Enter your surname" />
            <label htmlFor="email">E-mail Address</label>
            <input type="email" name="email-signup" id="email-signup" placeholder="Enter email Address"/>
            <label htmlFor="NIN">NIN Number</label>
            <input type="password" name="NIN" id="NIN" />
            <label htmlFor="Gender">Gender</label>
            <input type="radio" name="gender" value={male}/> Male
            <input type="radio" name="gender" value={female}/> Female
            <input type="radio" name="gender" value={female}/> Other
            <label htmlFor="DOB">Date Of birth</label>
            <input type="date" name="DOB" id="DOB" />
            <label htmlFor="Occupation">Occupation</label>
            <input type="Occupation" name="OCP" id="OCP" />
            <textarea name="address" id="" cols="30" rows="10" placeholder="Enter your full address"></textarea>
        
            

            

        </div>
    );

}
export default SignUp;