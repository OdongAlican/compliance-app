import React from 'react'
import { FaCog, FaHome, FaPoll, FaRegEnvelope } from 'react-icons/fa';


export const Products = () => {
  return (
    <section className="py-16 px-6 bg-white">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-20">
    Why Health & Safety <br/>Management Solutions?
  </h2>

  <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
    
    {/* Left Text Content */}
    <div className="flex-1">
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 ">


        {[
          {
            icon: <FaCog/>,
            text: "Proven to reduce incidents and improve safety KPIs."
          },
          {
            icon: <FaHome/>,
            text: "Fast onboarding & friendly support."
          },
          {
            icon: <FaPoll/>,
            text: "Designed for teams of any size."
          },
          {
            icon: <FaRegEnvelope/>,
            text: "Trusted by industry leaders."
          }
        ].map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 bg-gray-100 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-lg ">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-gray-700 font-medium">{item.text}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Right Image */}
    <div className="flex-1 lg:pl-6">
      <img
        src="/image2.jpg" // replace with your actual image
        alt="Safety Team"
        className="w-full rounded-lg shadow-lg object-cover"
      />
    </div>
  </div>
</section>

  )
}

