import React from 'react'


export function Solutions() {
  const sections = [
    {
      id: 1,
      heading: "One Platform. Total Visibility.",
      description:
        "We help teams take control of health and safety with powerful tools that make compliance easy, incidents preventable, and performance measurable.",
    },
    {
      id: 2,
      heading: "One Platform. Total Visibility.",
      description:
        "We help teams take control of health and safety with powerful tools that make compliance easy, incidents preventable, and performance measurable.",
    },
    {
      id: 3,
      heading: "One Platform. Total Visibility.",
      description:
        "We help teams take control of health and safety with powerful tools that make compliance easy, incidents preventable, and performance measurable.",
    },
  ];

  return (
    <section className="bg-gray-50 py-16 px-6">
      {/* Top Heading */}
      <h2 className="text-center text-4xl font-bold text-gray-800 mb-20">
        All in one tool for your<br/> workspace
      </h2>

      {/* Three Horizontal Panels */}
      <div className="space-y-12 mb-12">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={`flex flex-col lg:flex-row items-center justify-between gap-8 ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1">

              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                {section.heading}
              </h3>
              <p className="text-gray-600 leading-relaxed">{section.description}</p>
            </div>
            <div className="flex-1">
  <img
    src="/image3.jpg"  
    alt="Workspace Preview"
    className="w-full h-60 rounded-xl shadow-xl object-cover"
  />
</div>

          </div>
        ))}
      </div>

      {/* Sign-Up Button */}
      <div className="mt-16 flex justify-center">
        <button className="px-6 py-3 bg-primary text-tertiary rounded-md hover:bg-blue-700 transition font-medium shadow">
          Sign Up for free
        </button>
      </div>
    </section>
  );
}

