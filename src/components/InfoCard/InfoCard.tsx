import React from "react"

import styles from "./InfoCard.module.scss"
interface Props{
  imageUrl:string
  title:string
  desc:string
  footerImage:string
  footerTitle:string
}
const InfoCard = ({imageUrl,title,desc,footerImage,footerTitle}:Props) => {
  return (
    <div className={styles.card}>
      <img src={imageUrl} alt="" style={{ width: "100%" }} />
      <div className={styles.container}>
        <h4>
          <b className={styles.title}>{title}</b>
        </h4>
        <p className={styles.desc}>{desc}</p>
      </div>
      <div className={styles.footer}>
        <img src={footerImage} alt="" />
        <p className={styles.footerTitle}>{footerTitle}</p>
      </div>
    </div>
  )
}

export default InfoCard
