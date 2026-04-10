import React, { useContext } from "react";
import "../styles/Hero.css";
import heroImage from "../assets/img1.png";
import { Context } from "../main";

const Hero = () => {
  const { user } = useContext(Context);
  return (
    <>
      <div className="hero-section">
        <img src={heroImage} alt="hero-image" />
        <h4>Hello, {user ? user.name : "Developer"}</h4>
        <h1>Welcome to prince portfolio</h1>
        <p>
          i am achiever, a passionate web developer with a knack for creating dynamic and responsive web applications. With a strong foundation in both front-end and back-end technologies, i thrive on turning complex problems into elegant solutions. My journey in web development has been fueled by a relentless curiosity and a commitment to staying at the forefront of industry trends. Whether it's crafting seamless user experiences or optimizing server-side performance,
           i am dedicated to delivering high-quality code that not only meets but exceeds expectations. Let's connect and build something amazing together!  
        </p>
      </div>
    </>
  );
};

export default Hero;
