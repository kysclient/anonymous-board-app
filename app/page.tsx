"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./landing.module.css";

const SOMOIM_GID = "e03ab496-0dd3-11ee-8cf5-0a16fe5c82071";
const GALLERY_PAGE_COUNT = 5;
const DISPLAY_PHOTO_COUNT = 8;
const FALLBACK_PHOTOS = [
  "/subin.jpeg",
  "/hyungrae/4.jpeg",
  "/hyungrae/2.jpeg",
  "/hyungrae/1.jpeg",
  "/hyungrae/3.jpeg",
  "/banner2.png",
  "/banner.png",
  "/logo_dark.jpg",
];

interface GalleryPayload {
  data?: {
    images?: string[];
    nextCursor?: number | null;
  };
}

function shufflePhotos<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

async function getRandomGalleryPhotos(signal: AbortSignal) {
  const pages: string[][] = [];
  const seenCursors = new Set<number>();
  let cursor: number | null = 0;

  for (
    let pageIndex = 0;
    pageIndex < GALLERY_PAGE_COUNT && cursor !== null;
    pageIndex += 1
  ) {
    if (seenCursors.has(cursor)) break;
    seenCursors.add(cursor);

    const response: Response = await fetch(
      `/api/somoim?gid=${SOMOIM_GID}&s_t=${cursor}`,
      { cache: "no-store", signal }
    );

    if (!response.ok) break;

    const payload: GalleryPayload = await response.json();
    const pagePhotos: string[] = payload?.data?.images ?? [];

    if (pagePhotos.length > 0) pages.push(shufflePhotos(pagePhotos));

    const nextCursor: number | null | undefined = payload.data?.nextCursor;
    cursor = typeof nextCursor === "number" ? nextCursor : null;
  }

  if (pages.length === 0) return [];

  // Take photos round-robin from every fetched page so older and newer
  // moments are represented, then shuffle their final placement on the page.
  const selected: string[] = [];
  const longestPage = Math.max(...pages.map((page) => page.length));

  for (
    let photoIndex = 0;
    photoIndex < longestPage && selected.length < DISPLAY_PHOTO_COUNT;
    photoIndex += 1
  ) {
    for (const page of shufflePhotos(pages)) {
      const photo = page[photoIndex];
      if (photo && !selected.includes(photo)) selected.push(photo);
      if (selected.length === DISPLAY_PHOTO_COUNT) break;
    }
  }

  return shufflePhotos(selected);
}

function BrandLogo({ inverse = false }: { inverse?: boolean }) {
  if (inverse) {
    return (
      <Image
        src="/logo_v3/logo_light.png"
        alt="SPICY"
        width={230}
        height={74}
        priority
        className={styles.brandImage}
      />
    );
  }

  return (
    <span className={styles.adaptiveLogo}>
      <Image
        src="/logo_v3/logo_dark.png"
        alt="SPICY"
        width={230}
        height={74}
        priority
        className={styles.logoForLight}
      />
      <Image
        src="/logo_v3/logo_light.png"
        alt=""
        width={230}
        height={74}
        priority
        className={styles.logoForDark}
      />
    </span>
  );
}

export default function HomePage() {
  const [photos, setPhotos] = useState(FALLBACK_PHOTOS);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const controller = new AbortController();
    getRandomGalleryPhotos(controller.signal)
      .then((images) => {
        if (images.length >= DISPLAY_PHOTO_COUNT) setPhotos(images);
      })
      .catch(() => undefined);

    return () => {
      controller.abort();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <Link href="/" className={styles.logoLink} aria-label="SPICY 홈">
          {scrolled ? <BrandLogo /> : <BrandLogo inverse />}
        </Link>

        <nav className={styles.navLinks} aria-label="주요 메뉴">
          <a href="#story">About</a>
          <a href="#moments">Moments</a>
          <a href="#membership">Membership</a>
        </nav>

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.themeButton}
            aria-label="화면 테마 변경"
            onClick={() =>
              mounted && setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </button>
          <Link href="/dashboard" className={styles.navCta}>
            대시보드
            <ArrowRight />
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroTopline}>
          <span>PRIVATE SOCIAL CLUB</span>
          <span>SEOUL · 37°33′N 126°58′E</span>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.kicker}>좋은 사람들과, 매운 일상.</p>
          <h1>
            Life tastes better
            <br />
            <span>with SPICY.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>
              우리는 함께 웃고, 먹고, 여행하며 평범한 하루를
              <br className={styles.desktopBreak} /> 오래 기억될 장면으로 만듭니다.
            </p>
            <Link href="/dashboard" className={styles.heroCta}>
              대시보드 보러가기
              <ArrowRight />
            </Link>
          </div>
        </div>

        <div className={styles.heroArchive} aria-label="SPICY 모임 사진 아카이브">
          <figure className={styles.heroPhotoMain}>
            <div className={styles.photoPaper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt="SPICY가 함께한 순간" fetchPriority="high" />
            </div>
            <figcaption><span>SPICY ARCHIVE</span><span>001</span></figcaption>
          </figure>
          <figure className={styles.heroPhotoSide}>
            <div className={styles.photoPaper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[1]} alt="SPICY 모임의 한 장면" fetchPriority="high" />
            </div>
            <figcaption><span>SEOUL</span><span>002</span></figcaption>
          </figure>
          <figure className={styles.heroPhotoSmall}>
            <div className={styles.photoPaper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[2]} alt="SPICY 멤버의 순간" fetchPriority="high" />
            </div>
            <figcaption><span>TOGETHER</span><span>003</span></figcaption>
          </figure>
        </div>

        <a href="#story" className={styles.scrollHint} aria-label="소개로 이동">
          Scroll
          <ArrowDown />
        </a>
      </section>

      <section id="story" className={styles.manifesto}>
        <div className={styles.sectionMeta}>
          <span>01</span>
          <span>WHO WE ARE</span>
        </div>
        <div className={styles.manifestoBody}>
          <p className={styles.manifestoLead}>
            SPICY는 사람 사이의
            <br />
            <span>좋은 온도</span>를 만듭니다.
          </p>
          <div className={styles.manifestoCopy}>
            <p>
              낯선 사이가 편안한 친구가 되고, 별것 없던 하루가 두고두고
              꺼내 보는 기억이 되는 곳. SPICY는 서울을 기반으로 취향과
              경험을 나누는 프라이빗 소셜 커뮤니티입니다.
            </p>
            <a href="#moments">
              우리의 순간 보기
              <ArrowRight />
            </a>
          </div>
        </div>
      </section>

      <section className={styles.editorial}>
        <figure className={styles.editorialPrimary}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[1]} alt="함께 시간을 보내는 SPICY 멤버들" loading="lazy" />
          <figcaption>
            <span>TOGETHER, NATURALLY</span>
            <span>01 / 03</span>
          </figcaption>
        </figure>
        <div className={styles.editorialText}>
          <Image
            src="/main_logo.png"
            alt=""
            width={200}
            height={221}
            className={styles.flameMark}
          />
          <p className={styles.editorialEyebrow}>OUR ATTITUDE</p>
          <h2>잘 보이기보다<br />잘 어울리는 사이.</h2>
          <p>
            정해진 모습에 맞추기보다 각자의 취향을 존중합니다. 꾸미지 않아도
            편하고, 새로운 제안에는 기꺼이 함께하는 사람들. 그게 우리가
            생각하는 좋은 모임입니다.
          </p>
        </div>
        <figure className={styles.editorialSecondary}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[2]} alt="SPICY 모임의 한 장면" loading="lazy" />
        </figure>
      </section>

      <section id="moments" className={styles.moments}>
        <div className={styles.sectionMeta}>
          <span>02</span>
          <span>RECENT MOMENTS</span>
        </div>
        <div className={styles.momentsHeading}>
          <h2>우리를 가장 잘<br />설명하는 장면들.</h2>
          <Link href="/dashboard/gallery">
            전체 갤러리
            <ArrowRight />
          </Link>
        </div>
        <div className={styles.galleryGrid}>
          {photos.slice(2, 8).map((src, index) => (
            <figure key={`${src}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`SPICY 모임 사진 ${index + 1}`} loading="lazy" />
              <figcaption>
                <span>SPICY MOMENT</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.values}>
        <div className={styles.sectionMeta}>
          <span>03</span>
          <span>WHAT MATTERS</span>
        </div>
        <div className={styles.valueList}>
          <article>
            <span>01</span>
            <h3>함께</h3>
            <p>혼자보다 오래 기억되는 시간을 만듭니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>솔직하게</h3>
            <p>꾸미지 않은 모습 그대로 편안한 관계를 지향합니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>새롭게</h3>
            <p>익숙한 일상에도 기꺼이 새로운 장면을 더합니다.</p>
          </article>
        </div>
      </section>

      <section id="membership" className={styles.membership}>
        <div className={styles.membershipMark}>
          <Image src="/main_logo.png" alt="SPICY 불꽃 심볼" width={200} height={221} />
        </div>
        <p>SPICY MEMBERS</p>
        <h2>우리의 다음 장면은<br />이미 시작됐습니다.</h2>
        <Link href="/dashboard" className={styles.membershipCta}>
          대시보드 보러가기
          <ArrowRight />
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" aria-label="SPICY 홈">
          <BrandLogo inverse />
        </Link>
        <p>좋은 사람들과, 매운 일상.</p>
        <div className={styles.footerRight}>
          <Link href="/dashboard/gallery">Gallery</Link>
          <Link href="/dashboard">Dashboard</Link>
          <span>© 2026 SPICY</span>
        </div>
      </footer>
    </main>
  );
}
