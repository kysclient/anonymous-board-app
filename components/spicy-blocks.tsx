"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"
import Link from "next/link"
import { Crown } from "lucide-react"

const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

interface BoxWithEdgesProps {
    position: [number, number, number]
}

const BoxWithEdges: React.FC<BoxWithEdgesProps> = ({ position }) => {
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshPhysicalMaterial
                    color="#ff0000"
                    roughness={0.1}
                    metalness={0.8}
                    transparent={true}
                    opacity={0.9}
                    transmission={0.5}
                    clearcoat={1}
                />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
                <lineBasicMaterial color="#8b0000" linewidth={2} />
            </lineSegments>
        </group>
    )
}

interface BoxLetterProps {
    letter: string
    position: [number, number, number]
}

const BoxLetter: React.FC<BoxLetterProps> = ({ letter, position }) => {
    const group = useRef<THREE.Group>(null!)

    const getLetterShape = (letter: string): number[][] => {
        const shapes: { [key: string]: number[][] } = {
            S: [
                [1, 1, 1],
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 1],
                [1, 1, 1],
            ],
            P: [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1],
                [1, 0, 0],
                [1, 0, 0],
            ],
            I: [
                [1, 1, 1],
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0],
                [1, 1, 1],
            ],
            C: [
                [1, 1, 1],
                [1, 0, 0],
                [1, 0, 0],
                [1, 0, 0],
                [1, 1, 1],
            ],
            Y: [
                [1, 0, 1],
                [1, 0, 1],
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0],
            ],
        }
        return shapes[letter] || shapes['S'] // Default to 'S' if letter is not found
    }

    const letterShape = getLetterShape(letter)

    return (
        <group ref={group} position={position}>
            {letterShape.map((row, i) =>
                row.map((cell, j) => {
                    if (cell) {
                        let xOffset = j * 0.5 - (letter === 'I' || letter === 'Y' ? 0.5 : letter === 'S' || letter === 'P' || letter === 'C' ? 0.5 : 0.75)

                        if (letter === 'S') {
                            if (j === 0) {
                                xOffset = -0.5;
                            } else if (j === 1) {
                                xOffset = 0;
                            } else if (j === 2) {
                                xOffset = 0.5;
                            }
                        }

                        if (letter === 'P') {
                            if (j === 0) {
                                xOffset = -0.5;
                            } else if (j === 1) {
                                xOffset = 0;
                            } else if (j === 2) {
                                xOffset = 0.5;
                            }
                        }

                        if (letter === 'C') {
                            if (j === 0) {
                                xOffset = -0.5;
                            } else if (j === 1) {
                                xOffset = 0;
                            } else if (j === 2) {
                                xOffset = 0.5;
                            }
                        }

                        return (
                            <BoxWithEdges
                                key={`${i}-${j}`}
                                position={[xOffset, (4 - i) * 0.5 - 1, 0]}
                            />
                        )
                    }
                    return null
                })
            )}
        </group>
    )
}

const Scene: React.FC = () => {
    const orbitControlsRef = useRef<any>(null!)
    const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false)

    useEffect(() => {
        setIsMobileDevice(isMobile())
    }, [])

    return (
        <>
            <group position={[-0.5, 0, 0]} rotation={[0, Math.PI / 1.5, 0]}>
                <BoxLetter letter="S" position={[-5, 0, 0]} />
                <BoxLetter letter="P" position={[-2.5, 0, 0]} />
                <BoxLetter letter="I" position={[0, 0, 0]} />
                <BoxLetter letter="C" position={[2.5, 0, 0]} />
                <BoxLetter letter="Y" position={[5, 0, 0]} />
            </group>
            <OrbitControls
                ref={orbitControlsRef}
                enableZoom
                enablePan
                enableRotate
                autoRotate
                autoRotateSpeed={2}
                target={[0, 0, 0]} // Adjust the target point as needed
            />

            <ambientLight intensity={0.5} />

            <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />

            <Environment
                files={isMobileDevice
                    ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download3-7FArHVIJTFszlXm2045mQDPzsZqAyo.jpg"
                    : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dither_it_M3_Drone_Shot_equirectangular-jpg_San_Francisco_Big_City_1287677938_12251179%20(1)-NY2qcmpjkyG6rDp1cPGIdX0bHk3hMR.jpg"
                }
                background
            />
        </>
    )
}

export default function SpicyBlocks() {
    return (
        <div className="w-full h-screen bg-gray-900">
            <header className="fixed top-0 left-0 w-full z-[9999] w-full p-4">
                <div className="shadow-xl inline-block flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-md">
                    <Link href="/ranking">
                        <Crown className="w-5 h-5 text-white" />
                    </Link>
                </div>
            </header>
            <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 50, rotation: [Math.PI, 0, 0] }}>
                <Scene />
            </Canvas>
        </div>
    )
}