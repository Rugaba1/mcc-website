"use client"
import { createContext, useContext, useState, type ReactNode } from "react"

interface TextureContextType {
    texture: string | null
    wallTexture: string | null
    width: number
    height: number
    depth: number
    setTexture: (value: string | null) => void
    setWallTexture: (value: string | null) => void
    setWidth: (width: number) => void
    setHeight: (height: number) => void
    setDepth: (depth: number) => void
}

const TextureContext = createContext<TextureContextType | null>(null)

export default function TextureProvider({ children }: { children: ReactNode }) {
    const [texture, setTexture] = useState<string | null>(null)
    const [wallTexture, setWallTexture] = useState<string | null>(null)
    const [width, setWidth] = useState<number>(60)
    const [height, setHeight] = useState<number>(60)
    const [depth, setDepth] = useState<number>(1)

    return (
        <TextureContext value={{ texture, wallTexture, width, height, depth, setDepth, setTexture, setWallTexture, setHeight, setWidth }}>
            {children}
        </TextureContext>
    )
}

export function useTexture() {
    const context = useContext(TextureContext)
    if (!context) throw new Error("useTexture can only be used inside the Texture context")
    return context
}
