import React from 'react'
import {motion,AnimatePresence} from 'framer-motion'

export const ResponsiveMenu = ({open}) => {
  return (
    
<AnimatePresence mode='wait'>
{open && (
        <motion.div
            initial={{opacity:0, y:-100}}
            animate={{opacity:1, y:0}}
            exit={{opacity:0, y:-100}}
            transition={{duration:0.3}}
            className='absolute top-[4.5rem] left-0 w-full h-screen  z-40 '
            >
                <div className='text-xl font-semibold uppercase bg-primary text-white py-10 m-6 rounded-3xl'>
                    <ul className='flex flex-col justify-center items-center gap-10'>

                        <li>About us</li>
                        <li>Products</li>
                        <li>Solution</li>
                        <li>Contacts</li>
                        <li>SignIn</li>
                    </ul>

                </div>
                </motion.div>
    )
}
</AnimatePresence>
  )
}
