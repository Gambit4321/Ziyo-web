import Link from 'next/link';
import { Facebook, Instagram, Youtube, Send } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.grid}>
                    {/* Column 1: Logo & Info */}
                    <div className={styles.col}>
                        <div className={styles.logo}>
                            <span className={styles.ziyo}>ZIYO</span>
                            <span className={styles.uz}>.UZ</span>
                        </div>
                        <p className={styles.text}>
                            Xalqaro islomshunoslik akademiyasi qoshidagi "Ziyo" media markazi.
                        </p>
                        <div className={styles.contactInfo}>
                            <p>Aloqa markazi: (+998) 71 244-00-98</p>
                            <p>Toshkent sh., A.Qodiriy, 11</p>
                        </div>
                    </div>

                    {/* Column 2: Sahifalar */}
                    <div className={styles.col}>
                        <h4 className={styles.title}>Sahifalar</h4>
                        <ul className={styles.links}>
                            <li><Link href="/about">Biz haqimizda</Link></li>
                            <li><Link href="/team">Jamoa</Link></li>
                            <li><Link href="/contact">Bog'lanish</Link></li>
                            <li><Link href="/links">Barcha havolalar</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Loyihalar */}
                    <div className={styles.col}>
                        <h4 className={styles.title}>Loyihalar</h4>
                        <ul className={styles.links}>
                            <li><Link href="https://www.youtube.com/@ziyocinema" target="_blank">Ziyo Cinema</Link></li>
                            <li><Link href="/category/audio">Audiomahsulotlar</Link></li>
                            <li><Link href="/category/fotogalereya">Fotogalereya</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Social */}
                    <div className={styles.col}>
                        <h4 className={styles.title}>Bizni kuzating</h4>
                        <div className={styles.socials}>
                            <a href="https://t.me/ziyouz" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Telegram"><Send size={18} /></a>
                            <a href="https://www.instagram.com/ziyomediamarkazi" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram"><Instagram size={18} /></a>
                            <a href="https://www.facebook.com/ziyomedia" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook"><Facebook size={18} /></a>
                            <a href="https://www.youtube.com/@ZiyomediamarkaziKorsatuvlar" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Youtube"><Youtube size={18} /></a>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© {new Date().getFullYear()} Ziyo.uz. Barcha huquqlar himoyalangan.</p>
                    <p>Sayt materiallaridan foydalanilganda manba ko'rsatilishi shart.</p>
                </div>
            </div>
        </footer>
    );
}
