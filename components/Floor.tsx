import { useEffect, useRef, useState, useCallback, useMemo, useCallback as _cb } from 'react'
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { OrbitControls } from "@react-three/drei"
import { useTexture } from '../contexts/texture-context'
import { useTexture as useTextureDrei } from '@react-three/drei'
import { Input } from './ui/input'

interface SectionData {
  id: string
  name: string
  type: 'floor' | 'wall'
  position: [number, number, number]
  size: [number, number, number]
}


const WALL_H = 2.7
const WALL_T = 0.15
const FLOOR_T = 0.15
const DOOR_W = 0.9
const DOOR_H = 2.1


const SCALE = 1.5

const HOUSE_W = 8.0 * SCALE
const HOUSE_D = 9.0 * SCALE
const HW = HOUSE_W / 2
const HD = HOUSE_D / 2

const GF_Y = 0
const UF_Y = WALL_H + FLOOR_T
const ROOF_BASE_Y = UF_Y + WALL_H

const LIVING_W = 4.0 * SCALE
const KITCHEN_W = 4.0 * SCALE

const STAIR_W = 2.0 * SCALE
const POWDER_W = 1.5 * SCALE
const HALL_W = HOUSE_W - STAIR_W - POWDER_W

const X_LEFT = -HW
const X_MID = 0
const X_RIGHT = HW
const X_STAIR_R = X_LEFT + STAIR_W
const X_POWDER_R = X_STAIR_R + POWDER_W
const BACK_DOOR_CX = 1.75 * SCALE

const Z_FRONT = HD
const Z_BACK = -HD
const Z_MID = 0


const ROOF_OVERHANG = 0.6 * SCALE
const ROOF_RUN = HD + ROOF_OVERHANG
const ROOF_RISE = 2.0 * SCALE
const ROOF_PITCH = Math.atan2(ROOF_RISE, ROOF_RUN)
const ROOF_SLANT = Math.sqrt(ROOF_RUN * ROOF_RUN + ROOF_RISE * ROOF_RISE) + 0.15

const BALCONY_W = 3.0 * SCALE
const BALCONY_D = 1.2 * SCALE
const BALCONY_CX = 2.0 * SCALE


const GROUT_WIDTH_CM = 0.6
const GROUT_COLOR = '#d8d5cc'
const TILE_TEXTURE_RES = 512


const EXTERIOR_WALL_IDS = new Set([
  'gf-front-l', 'gf-front-r', 'gf-back-l', 'gf-back-r', 'gf-left', 'gf-right',
  'uf-front-bed1', 'uf-front-bed2-l', 'uf-front-bed2-r',
  'uf-back', 'uf-left', 'uf-right',
])
function wall(id: string, name: string, cx: number, cz: number, dimX: number, dimZ: number, baseY: number): SectionData {
  return { id, name, type: 'wall', position: [cx, baseY + WALL_H / 2, cz], size: [dimX, WALL_H, dimZ] }
}
function floorSlab(id: string, name: string, cx: number, cz: number, dimX: number, dimZ: number, baseY: number): SectionData {
  return { id, name, type: 'floor', position: [cx, baseY + FLOOR_T / 2, cz], size: [dimX, FLOOR_T, dimZ] }
}


function sharedInteriorWalls(baseY: number, prefix: string): SectionData[] {
  return [

    wall(`${prefix}-div-a`, 'Stair Bay Divider', X_STAIR_R, -4.0 * SCALE, WALL_T, 1.0 * SCALE, baseY),
    wall(`${prefix}-div-b1`, 'Wet Room Wall (lower1)', X_STAIR_R, -2.3 * SCALE, WALL_T, 2.6 * SCALE, baseY),
    wall(`${prefix}-div-b2`, 'Wet Room Wall (upper)', X_POWDER_R, -4.0 * SCALE, WALL_T, 1.0 * SCALE, baseY),
    wall(`${prefix}-div-b3`, 'Wet Room Wall (lower2)', X_POWDER_R, -1.3 * SCALE, WALL_T, 2.6 * SCALE, baseY),
    wall(`${prefix}-div-z1`, 'Zone Wall Seg 1', -3.6 * SCALE, Z_MID, 0.8 * SCALE, WALL_T, baseY),
    wall(`${prefix}-div-z2`, 'Zone Wall Seg 2', -0.65 * SCALE, Z_MID, 3.3 * SCALE, WALL_T, baseY),
    wall(`${prefix}-div-z3`, 'Zone Wall Seg 3', 2.95 * SCALE, Z_MID, 2.1 * SCALE, WALL_T, baseY),
  ]
}

function groundFloorData() {
  const walls: SectionData[] = [

    wall('gf-front-l', 'Front Wall Left', (X_LEFT + (-DOOR_W / 2)) / 2, Z_FRONT, (-DOOR_W / 2) - X_LEFT, WALL_T, GF_Y),
    wall('gf-front-r', 'Front Wall Right', ((DOOR_W / 2) + X_RIGHT) / 2, Z_FRONT, X_RIGHT - (DOOR_W / 2), WALL_T, GF_Y),

    wall('gf-back-l', 'Back Wall Left', (X_LEFT + (BACK_DOOR_CX - DOOR_W / 2)) / 2, Z_BACK, (BACK_DOOR_CX - DOOR_W / 2) - X_LEFT, WALL_T, GF_Y),
    wall('gf-back-r', 'Back Wall Right', ((BACK_DOOR_CX + DOOR_W / 2) + X_RIGHT) / 2, Z_BACK, X_RIGHT - (BACK_DOOR_CX + DOOR_W / 2), WALL_T, GF_Y),

    wall('gf-left', 'Left Wall', X_LEFT, Z_MID, WALL_T, HOUSE_D, GF_Y),
    wall('gf-right', 'Right Wall', X_RIGHT, Z_MID, WALL_T, HOUSE_D, GF_Y),

    wall('gf-lk-1', 'Living-Kitchen Wall Top', X_MID + 0.7, 3.2 * SCALE, WALL_T, 2.3 * SCALE, GF_Y),
    wall('gf-lk-2', 'Living-Kitchen Wall Bottom', X_MID + 0.7, 0.45 * SCALE, WALL_T, 0.9 * SCALE, GF_Y),
    ...sharedInteriorWalls(GF_Y, 'gf'),
  ]
  const floors: SectionData[] = [
    floorSlab('f-living', 'Living Room Floor', -LIVING_W / 2, HD / 2, LIVING_W, HD, GF_Y),
    floorSlab('f-kitchen', 'Kitchen & Dining Floor', KITCHEN_W / 2, HD / 2, KITCHEN_W, HD, GF_Y),
    floorSlab('f-stair', 'Staircase Floor', -3.0 * SCALE, -2.25 * SCALE, STAIR_W, HD, GF_Y),
    floorSlab('f-powder', 'Powder Room Floor', -1.25 * SCALE, -2.25 * SCALE, POWDER_W, HD, GF_Y),
    floorSlab('f-hallway', 'Hallway / Utility Floor', BACK_DOOR_CX, -2.25 * SCALE, HALL_W, HD, GF_Y),
  ]
  return { walls, floors }
}


function upperFloorData() {
  const walls: SectionData[] = [
    wall('uf-front-bed1', 'Bedroom 1 Front Wall', (X_LEFT + X_MID) / 2, Z_FRONT, X_MID - X_LEFT, WALL_T, UF_Y),
    wall('uf-front-bed2-l', 'Bedroom 2 Front Wall Left', (X_MID + (BALCONY_CX - DOOR_W / 2)) / 2, Z_FRONT, (BALCONY_CX - DOOR_W / 2) - X_MID, WALL_T, UF_Y),
    wall('uf-front-bed2-r', 'Bedroom 2 Front Wall Right', ((BALCONY_CX + DOOR_W / 2) + X_RIGHT) / 2, Z_FRONT, X_RIGHT - (BALCONY_CX + DOOR_W / 2), WALL_T, UF_Y),
    wall('uf-back', 'Back Wall', X_MID, Z_BACK, HOUSE_W, WALL_T, UF_Y),
    wall('uf-left', 'Left Wall', X_LEFT, Z_MID, WALL_T, HOUSE_D, UF_Y),
    wall('uf-right', 'Right Wall', X_RIGHT, Z_MID, WALL_T, HOUSE_D, UF_Y),
    wall('uf-bed-div', 'Bedroom 1-2 Divider', X_MID, HD / 2, WALL_T, HD, UF_Y),
    ...sharedInteriorWalls(UF_Y, 'uf'),
  ]
  const floors: SectionData[] = [
    floorSlab('f-bed1', 'Bedroom 1 (Master) Floor', -LIVING_W / 2, HD / 2, LIVING_W, HD, UF_Y),
    floorSlab('f-bed2', 'Bedroom 2 Floor', KITCHEN_W / 2, HD / 2, KITCHEN_W, HD, UF_Y),
    floorSlab('f-landing', '', -3.0 * SCALE, -0.5 * SCALE, STAIR_W, 1.0 * SCALE, UF_Y),
    floorSlab('f-bathroom', '', -1.25 * SCALE, -2.25 * SCALE, POWDER_W, HD, UF_Y),
    floorSlab('f-hallway-u', '', BACK_DOOR_CX, -2.25 * SCALE, HALL_W, HD, UF_Y),
    floorSlab('f-balcony', '', BALCONY_CX, Z_FRONT + BALCONY_D / 2 + WALL_T / 2, BALCONY_W, BALCONY_D, UF_Y),
  ]
  return { walls, floors }
}



const matGableEnd = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.9, side: THREE.DoubleSide })
const matGutter = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.7 })
const matGlass = new THREE.MeshStandardMaterial({ color: 0xadd8e6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 })
const matConcrete = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 })
const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 })
const matGrass = new THREE.MeshStandardMaterial({ color: 0x3B5549, roughness: 1 })
const matWhite = new THREE.MeshStandardMaterial({ color: 0xf0f0e8 })
const matDoor = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.6 })
const matStepTread = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6 })




function BrickMaterial({ size }: { size: [number, number, number] }) {
  const [colorMap, normalMap, roughnessMap] = useTextureDrei([
    '/textures/bricks/Bricks097_1K-JPG_Color.jpg',
    '/textures/bricks/Bricks097_1K-JPG_NormalGL.jpg',
    '/textures/bricks/Bricks097_1K-JPG_Roughness.jpg',
  ])


  const dims = [...size].sort((a, b) => b - a)
  const faceW = dims[0]
  const faceH = dims[1]

  const repeatX = faceW / 2.2
  const repeatY = faceH / 2.2

  const c = colorMap.clone()
  const n = normalMap.clone()
  const r = roughnessMap.clone()

    ;[c, n, r].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(repeatX, repeatY)
      t.anisotropy = 16
    })

  return (
    <meshStandardMaterial
      map={c}
      normalMap={n}
      normalScale={new THREE.Vector2(1.2, 1.2)}
      roughnessMap={r}
      roughness={1}
      metalness={0.05}
    />
  )
}

function RoofMaterial() {
  const [colorMap, normalMap, roughnessMap, metalnessMap] = useTextureDrei([
    '/textures/roof/CorrugatedSteel005_1K-JPG_Color.jpg',
    '/textures/roof/CorrugatedSteel005_1K-JPG_NormalGL.jpg',
    '/textures/roof/CorrugatedSteel005_1K-JPG_Roughness.jpg',
    '/textures/roof/CorrugatedSteel005_1K-JPG_Metalness.jpg',
  ])

  const repeatX = 4
  const repeatY = 5

    ;[colorMap, normalMap, roughnessMap, metalnessMap].forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(repeatX, repeatY)
      tex.anisotropy = 16
    })

  return (
    <meshStandardMaterial
      map={colorMap}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(1, 1)}
      roughnessMap={roughnessMap}
      metalnessMap={metalnessMap}
      metalness={1}
      roughness={1}
      side={THREE.DoubleSide}
    />
  )
}

function Section({ data, onMeshReFAvailable, isSelected, floorTexture, isExterior, }: {
  data: SectionData
  onMeshReFAvailable?: (id: string, mesh: THREE.Mesh) => void
  isSelected?: boolean
  floorTexture?: string
  isExterior?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const baseColor = data.type === 'wall' ? '#f0f0e8' : '#CCCCCC'
  const baseRoughness = data.type === 'wall' ? 0.9 : 0.8
  const { width, height } = useTexture();

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = { sectionId: data.id, sectionName: data.name, sectionType: data.type }
      if (onMeshReFAvailable) {
        onMeshReFAvailable(data.id, meshRef.current!)
      }
    }
  }, [data.id, data.name, data.type])


  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const mat = mesh.material as THREE.MeshStandardMaterial

    // Cleanup helper — called both on effect re-run and on unmount
    const clear = () => {
      if (mat.map) { mat.map.dispose(); mat.map = null }
      mat.color.set(baseColor)
      mat.needsUpdate = true
    }

    if (!floorTexture) { clear(); return clear }

    const geo = mesh.geometry as THREE.BoxGeometry
    const { width: bw, height: bh, depth: bd } = geo.parameters

    let planA: number
    let planB: number
    if (data.type === 'floor') {
      planA = bw
      planB = bd
    } else {
      planA = Math.abs(bw - WALL_T) < 0.001 ? bd : bw
      planB = bh
    }

    const tileW = Math.max(0.01, width / 100)
    const tileH = Math.max(0.01, height / 100)
    const grout = GROUT_WIDTH_CM / 100
    const pitchW = tileW + grout
    const pitchH = tileH + grout

    const repeatX = Math.max(1, Math.round(planA / pitchW))
    const repeatY = Math.max(1, Math.round(planB / pitchH))

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return

      const canvas = document.createElement('canvas')
      canvas.width = TILE_TEXTURE_RES
      canvas.height = TILE_TEXTURE_RES
      const ctx = canvas.getContext('2d')
      if (!ctx || cancelled) return

      const insetXFrac = grout / (2 * pitchW)
      const insetYFrac = grout / (2 * pitchH)
      const insetX = TILE_TEXTURE_RES * insetXFrac
      const insetY = TILE_TEXTURE_RES * insetYFrac

      ctx.fillStyle = GROUT_COLOR
      ctx.fillRect(0, 0, TILE_TEXTURE_RES, TILE_TEXTURE_RES)
      ctx.drawImage(img, insetX, insetY, TILE_TEXTURE_RES - insetX * 2, TILE_TEXTURE_RES - insetY * 2)

      const tex = new THREE.CanvasTexture(canvas)
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(repeatX, repeatY)
      tex.needsUpdate = true
      tex.colorSpace = THREE.SRGBColorSpace
      if (mat.map) mat.map.dispose()
      mat.map = tex
      mat.color.set('#ffffff')
      mat.needsUpdate = true
    }
    img.src = floorTexture

    // Cleanup runs immediately on effect re-run / unmount
    return () => {
      cancelled = true
      clear()
    }
  }, [floorTexture, width, height, data.type, baseColor])


  return (
    <mesh
      ref={meshRef}
      position={data.position}
      castShadow
      receiveShadow

      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      <boxGeometry args={data.size} />
      {isExterior && data.type === 'wall' ? (
        <BrickMaterial size={data.size} />
      ) : (
        <meshStandardMaterial
          color={baseColor}
          roughness={baseRoughness}
          metalness={0.05}
          emissive={isSelected ? '#333333' : hovered ? '#111111' : '#000000'}
        />
      )}
    </mesh>
  )
}



function Window({ position, size }: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  const frameTex = useTextureDrei('/textures/windows/windowframe4.jpg')
  frameTex.colorSpace = THREE.SRGBColorSpace

  const isZWall = size[2] < 0.1
  const isXWall = size[0] < 0.1

  const w = isZWall ? size[0] : size[2]
  const h = size[1]

  const rotY = isXWall
    ? (position[0] > 0 ? Math.PI / 2 : -Math.PI / 2)
    : (position[2] > 0 ? 0 : Math.PI)

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={0xadd8e6}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={frameTex}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          color="#ffffff"
        />
      </mesh>
    </group>
  )
}

function Staircase() {
  const STEPS = 14
  const riser = WALL_H / STEPS
  const runDepth = (3.8 * SCALE) / STEPS
  const startZ = -4.486 * SCALE
  const stepW = 1.2 * SCALE
  const steps = []
  for (let i = 0; i < STEPS; i++) {
    const y = FLOOR_T + 0.19 + riser * (i + 0.3)
    const z = startZ + runDepth * (i + 0.5)
    steps.push(
      <mesh key={`step-${i}`} position={[-3 * SCALE, y - 0.5, z]} material={matStepTread} castShadow receiveShadow>
        <boxGeometry args={[stepW, riser, runDepth]} />
      </mesh>
    )
  }
  return (
    <group>
      {steps}


    </group>
  )
}


function GableEnd({ x }: { x: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-HD, 0)
    shape.lineTo(HD, 0)
    shape.lineTo(0, ROOF_RISE)
    shape.lineTo(-HD, 0)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    geo.translate(x, ROOF_BASE_Y, 0)
    return geo
  }, [x])
  return <mesh geometry={geometry} material={matGableEnd} castShadow receiveShadow />
}


function House() {
  const gf = useMemo(() => groundFloorData(), [])
  const uf = useMemo(() => upperFloorData(), [])
  const { texture, wallTexture } = useTexture()
  const [visibleSections, setVisibleSections] = useState<{ roof: boolean, ground: boolean, upper: boolean }>({ "roof": true, "ground": true, "upper": true })

  useEffect(() => {
    // Remove roof whenever any tile is applied so interior is visible
    if (texture || wallTexture) {
      setVisibleSections((prev) => ({ ...prev, roof: false }))
    } else {
      setVisibleSections({ roof: true, ground: true, upper: true })
    }
  }, [texture, wallTexture])

  return (
    <group>
      {gf.floors.map(f => (
        <Section key={f.id} data={f} floorTexture={texture ? texture : undefined} />
      ))}
      {gf.walls.map(w => (
        <Section
          key={w.id}
          data={w}
          isExterior={EXTERIOR_WALL_IDS.has(w.id)}
          floorTexture={!EXTERIOR_WALL_IDS.has(w.id) && wallTexture ? wallTexture : undefined}
        />
      ))}
      {<Staircase />}

      {uf.floors.map(f => (
        <Section key={f.id} data={f} floorTexture={texture ? texture : undefined} />
      ))}
      {uf.walls.map(w => (
        <Section
          key={w.id}
          data={w}
          isExterior={EXTERIOR_WALL_IDS.has(w.id)}
          floorTexture={!EXTERIOR_WALL_IDS.has(w.id) && wallTexture ? wallTexture : undefined}
        />
      ))}


      {<>
        <mesh position={[0, DOOR_H / 2, Z_FRONT + WALL_T / 2 + 0.02]} material={matDoor}>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.08]} />
        </mesh>
        <mesh position={[0, DOOR_H + (WALL_H - DOOR_H) / 2, Z_FRONT]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
          <BrickMaterial size={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
        </mesh>
        <mesh position={[-(DOOR_W / 2 + 0.025), DOOR_H / 2, Z_FRONT + WALL_T / 2 + 0.03]} material={matWoodDark}>
          <boxGeometry args={[0.05, DOOR_H, 0.1]} />
        </mesh>
        <mesh position={[(DOOR_W / 2 + 0.025), DOOR_H / 2, Z_FRONT + WALL_T / 2 + 0.03]} material={matWhite}>
          <boxGeometry args={[0.05, DOOR_H, 0.1]} />
        </mesh>
        <mesh position={[BACK_DOOR_CX, DOOR_H / 2, Z_BACK - WALL_T / 2 - 0.02]} material={matDoor}>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.08]} />
        </mesh>
        <mesh position={[BACK_DOOR_CX, DOOR_H + (WALL_H - DOOR_H) / 2, Z_BACK]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
          <BrickMaterial size={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
        </mesh>
      </>}


      {<>
        <mesh position={[BALCONY_CX, UF_Y + DOOR_H / 2, Z_FRONT + WALL_T / 2 + 0.02]} material={matGlass}>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
        </mesh>
        <mesh position={[BALCONY_CX, UF_Y + DOOR_H + (WALL_H - DOOR_H) / 2, Z_FRONT]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
          <BrickMaterial size={[DOOR_W + 0.1, WALL_H - DOOR_H, WALL_T]} />
        </mesh>


        <mesh position={[BALCONY_CX, UF_Y + 0.6, Z_FRONT + BALCONY_D + WALL_T / 2]} material={matWhite}>
          <boxGeometry args={[BALCONY_W, 1.0, 0.05]} />
        </mesh>
        <mesh position={[BALCONY_CX - BALCONY_W / 2, UF_Y + 0.6, Z_FRONT + BALCONY_D / 2 + WALL_T / 2]} material={matWhite}>
          <boxGeometry args={[0.05, 1.0, BALCONY_D]} />
        </mesh>
        <mesh position={[BALCONY_CX + BALCONY_W / 2, UF_Y + 0.6, Z_FRONT + BALCONY_D / 2 + WALL_T / 2]} material={matWhite}>
          <boxGeometry args={[0.05, 1.0, BALCONY_D]} />
        </mesh>
      </>}

      {visibleSections.roof && <>
        <mesh
          position={[0, ROOF_BASE_Y + ROOF_RISE / 2, ROOF_RUN / 2]}
          rotation={[ROOF_PITCH, 0, 0]}
          castShadow
        >
          <boxGeometry args={[HOUSE_W + ROOF_OVERHANG * 2, 0.08, ROOF_SLANT]} />
          <RoofMaterial />
        </mesh>

        <mesh
          position={[0, ROOF_BASE_Y + ROOF_RISE / 2, -ROOF_RUN / 2]}
          rotation={[-ROOF_PITCH, 0, 0]}
          castShadow
        >
          <boxGeometry args={[HOUSE_W + ROOF_OVERHANG * 2, 0.08, ROOF_SLANT]} />
          <RoofMaterial />
        </mesh>

        <mesh position={[0, ROOF_BASE_Y + ROOF_RISE + 0.04, 0]} material={matGutter}>
          <boxGeometry args={[HOUSE_W + ROOF_OVERHANG * 2 + 0.1, 0.08, 0.2]} />
        </mesh>
        <GableEnd x={-HW - 0.02} />
        <GableEnd x={HW + 0.02} />


        <mesh position={[0, ROOF_BASE_Y - 0.05, Z_FRONT + 0.4]} material={matGutter}>
          <boxGeometry args={[HOUSE_W + 1.2, 0.12, 0.12]} />
        </mesh>
        <mesh position={[0, ROOF_BASE_Y - 0.05, Z_BACK - 0.4]} material={matGutter}>
          <boxGeometry args={[HOUSE_W + 1.2, 0.12, 0.12]} />
        </mesh>
        <mesh position={[X_LEFT - 0.5, ROOF_BASE_Y / 2, Z_FRONT + 0.4]} material={matGutter}>
          <cylinderGeometry args={[0.06, 0.06, ROOF_BASE_Y, 8]} />
        </mesh>
        <mesh position={[X_RIGHT + 0.5, ROOF_BASE_Y / 2, Z_FRONT + 0.4]} material={matGutter}>
          <cylinderGeometry args={[0.06, 0.06, ROOF_BASE_Y, 8]} />
        </mesh></>}


      {[
        { p: [-2.0 * SCALE, 1.5, Z_FRONT + 0.08] as [number, number, number], s: [1.6, 1.2, 0.06] as [number, number, number] },
        { p: [X_LEFT - 0.08, 1.5, 1.5 * SCALE] as [number, number, number], s: [0.06, 1.2, 1.4] as [number, number, number] },
        { p: [X_RIGHT + 0.08, 1.5, 1.5 * SCALE] as [number, number, number], s: [0.06, 1.2, 1.4] as [number, number, number] },
        { p: [X_RIGHT + 0.08, 1.5, -1.0 * SCALE] as [number, number, number], s: [0.06, 1.0, 1.0] as [number, number, number] },
        { p: [-2.0 * SCALE, UF_Y + 1.5, Z_FRONT + 0.08] as [number, number, number], s: [1.6, 1.2, 0.06] as [number, number, number] },
        { p: [X_LEFT - 0.08, UF_Y + 1.5, 1.5 * SCALE] as [number, number, number], s: [0.06, 1.2, 1.4] as [number, number, number] },
        { p: [X_RIGHT - 1.0, UF_Y + 1.5, Z_FRONT + 0.08] as [number, number, number], s: [1.0, 1.0, 0.06] as [number, number, number] },
        { p: [X_LEFT - 0.08, UF_Y + 1.5, -2.0 * SCALE] as [number, number, number], s: [0.06, 1.0, 1.0] as [number, number, number] },
      ].map((win, i) => (
        <Window key={`win-${i}`} position={win.p} size={win.s} />
      ))}





    </group>
  )
}


function Environment() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={matGrass}>
        <planeGeometry args={[100, 100]} />
      </mesh>
      <mesh position={[0, 0.02, Z_FRONT + 3]} receiveShadow material={matConcrete}>
        <boxGeometry args={[2.5, 0.05, 6]} />
      </mesh>
      <mesh position={[0, 0.02, Z_FRONT + 0.9]} receiveShadow material={matConcrete}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
      </mesh>

    </>
  )
}





function TilePanel() {
  const { texture, setTexture, width, setWidth, height, setHeight, depth, setDepth } = useTexture()
  const handleUpload = useCallback((file: File) => {
    if (texture) URL.revokeObjectURL(texture)
    setTexture(URL.createObjectURL(file))
  }, [texture])

  return (
    <div style={{
      background: '#ffff', padding: 5, border: '1px solid #444',
      display: 'flex', flexDirection: 'column', gap: 14, minWidth: 380, maxWidth: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ textAlign: 'center', letterSpacing: 0.5 }}>
        Tile Configurations
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <label style={{

          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          Width


        </label>
        <Input key={"Input-1"} type="number" min={0} style={{ border: "3px solid gray", padding: '8px 16px' }} value={String(width)} onChange={(e) => setWidth(Number(e.target.value) || 0)}
        />

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <label style={{

          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          Height


        </label>
        <Input key={"Input-2"} type="number" min={0} style={{ border: "3px solid gray", padding: '8px 16px' }} value={String(height)} onChange={(e) => {
          setHeight(Number(e.target.value) || 0)
        }}
        />

      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <label style={{

          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          Depth


        </label>
        <Input key={"Input-3"} type="number" min={0} style={{ border: "3px solid gray", padding: '8px 16px' }} value={String(depth)} onChange={(e) => {
          setDepth(Number(e.target.value))
        }}
        />

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <label style={{

          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          Design


        </label>
        <label style={{
          padding: '8px 16px', border: '1px solid gray',
          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          Upload Your Tile Design
          <Input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { handleUpload(f) }

            }} />

        </label>

      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>

        {texture &&
          <div style={{

            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>

            <div>
              Height: <strong>{height} cm</strong>
            </div>
            <div>
              <div>
                Width: <strong>{width} cm</strong>
              </div>
              <img src={texture} width={width} height={height} />
            </div>


          </div>
        }

      </div>







    </div >
  )
}


// ── CameraRig — smoothly animates the camera after mount ─────────────────────
// R3F's <Canvas camera> prop is mount-time only; this component drives the
// camera by writing directly to camera.position via useThree + useFrame.
function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree()
  const currentRef = useRef<[number, number, number]>([camera.position.x, camera.position.y, camera.position.z])

  // Sync when target changes
  useEffect(() => {
    currentRef.current = target
  }, [target])

  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(...currentRef.current),
      0.05  // smooth factor — 5% per frame
    )
  })

  return null
}

// ── Standalone 3D house canvas — used by visualizer/page.tsx ─────────────────
// surface="floor"  → elevated angle looking down at floors
// surface="wall"   → eye-level angle looking at interior front wall
export function House3D({
  className,
  style,
  surface = "floor",
}: {
  className?: string
  style?: React.CSSProperties
  surface?: "floor" | "wall"
}) {
  const { texture, wallTexture } = useTexture()
  const hasTexture = !!(texture || wallTexture)

  // Camera target positions per surface + state
  const CAMERA_INIT: Record<string, [number, number, number]> = {
    floor: [18, 14, 18],
    wall: [1, 4.5, 22],
  }
  const CAMERA_APPLIED: Record<string, [number, number, number]> = {
    floor: [7, 20, 7],    // top-down: see all floor tiles
    wall: [1, 3.2, 13],  // eye-level: see wall tiles close-up
  }

  const [camTarget, setCamTarget] = useState<[number, number, number]>(CAMERA_INIT[surface])

  useEffect(() => {
    setCamTarget(hasTexture ? CAMERA_APPLIED[surface] : CAMERA_INIT[surface])
  }, [hasTexture, surface])

  // Also reset when surface changes to always start from a sensible angle
  useEffect(() => {
    setCamTarget(hasTexture ? CAMERA_APPLIED[surface] : CAMERA_INIT[surface])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface])

  const orbitTarget: [number, number, number] = surface === "wall" ? [0, 2.8, 0] : [0, 2, 0]

  return (
    <div
      className={className}
      style={{ background: '#0a0a0f', width: '100%', height: '100%', ...style }}
    >
      <Canvas
        shadows
        camera={{ position: CAMERA_INIT[surface] as [number, number, number], fov: surface === "wall" ? 52 : 44 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* CameraRig animates camera.position towards camTarget every frame */}
        <CameraRig target={camTarget} />

        <OrbitControls
          target={orbitTarget}
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.05}
        />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[15, 22, 10]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
        />
        {/* Fill light from the opposite side so interior walls are lit */}
        <directionalLight position={[-10, 8, -10]} intensity={0.4} />
        <hemisphereLight args={[0x87CEEB, 0x444444, 0.45]} />
        <fog attach="fog" args={['#6D93A2', 30, 75]} />
        <House />
        <Environment />
      </Canvas>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { texture } = useTexture()
  const [cameraPosition, setCameraPosition] = useState<[x: number, y: number, z?: number]>([15, 5, 15])




  useEffect(() => {
    setCameraPosition([9, 30, 5])
  }, [texture])

  return (

    <div style={{ background: '#0a0a0f', width: '100vw', height: '100vh', display: 'flex', overflowX: 'hidden', fontFamily: 'Times New Roman, serif' }}>


      <Canvas shadows camera={{ position: [...cameraPosition], fov: 40 }} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>

        <OrbitControls
          target={[0, 3, 0]}
          enableDamping dampingFactor={0.08}
          minDistance={1.2} maxDistance={45}
          maxPolarAngle={Math.PI / 2.05}
          onUpdate={(c) => {
            console.log(c.getPolarAngle())
          }}
        />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[15, 22, 10]} intensity={1.2} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-near={0.5} shadow-camera-far={60}
          shadow-camera-left={-22} shadow-camera-right={22}
          shadow-camera-top={22} shadow-camera-bottom={-22}
        />
        <hemisphereLight args={[0x87CEEB, 0x444444, 0.4]} />
        <fog attach="fog" args={["#6D93A2", 28, 75]} />

        <House />
        <Environment />
      </Canvas>
      <TilePanel

      />


    </div>
  )
}