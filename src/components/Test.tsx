import React from 'react'

const Test = () => {

    const getKeplr=async()=>{
    }

  return (
    <div style={{margin:'30px'}}>window modes
        <p>
        {
            getKeplr()
            // window?.keplr?.mode ?? "nothing"
        }
        </p>
    </div>
  )
}

export default Test