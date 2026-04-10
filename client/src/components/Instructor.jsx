import React from "react";
import "../styles/Instructor.css";
import instructorImage from "../assets/profile.png";

const Instructor = () => {
  return (
    <div className="instructor-page">
      <div className="instructor-card">
        <div className="instructor-image">
          <img src={instructorImage} alt="Instructor" />
        </div>
        <div className="instructor-info">
          <h1>Prince Kumar Bhaskar</h1>
          <h4>Your Trully</h4>
          <p>
            hi ,  welcome to my first website , i have completed my first project.
          </p>
          <div className="social-links">
            <a
              href="https://github.com/Princebhaskar"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/prince0599/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://www.youtube.com/channel/UCbGtkGZ9sDg54PtU3GEDE6w"
              target="_blank"
              rel="noopener noreferrer"
            >
              Youtube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
