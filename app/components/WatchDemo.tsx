import React from 'react'

type Props = {}

const WatchDemo = (props: Props) => {
  return (
    <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>
        {/* show demo of collaborative whiteboard in short */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl">
            Watch Demo
        </div>
    </div>
  )
}

export default WatchDemo