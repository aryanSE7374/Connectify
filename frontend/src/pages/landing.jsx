import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (

    <div className='landingPageContainer'>
      <nav>

        <div className="navHeader">
          <h2>Connectify</h2>
        </div>

        <div className="navList">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role='button'>
            <p>Login</p>
          </div>
        </div>

      </nav>

      <div className="landingMainContainer">
        <div>
          <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>
          <p>Cover a distance by Connectify</p>
            <div role='button'>
                <Link to={"/auth"}>Get Started</Link>
            </div>
        </div>
          <img src="/mobile2.png" alt="mobiles" />
      </div>

    </div>
  )
}
