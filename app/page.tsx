"use client"

import React, { useEffect } from 'react'
import LandingPage from './landing'

const page = () => {

  useEffect(() => {
    localStorage.setItem("theme", "dark");
  }, [])

  return (
    <div>
        <LandingPage />
    </div>
  )
}

export default page