import * as THREE from "three";
import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";

type Vec3 = [number, number, number];
const C = {
  sky: "#101827",
  ground: "#252A32",
  building: "#343943",
  steel: "#AEB7C2",
  dark: "#111720",
  glass: "#13283A",
  solar: "#102C50",
  purple: "#9C4DFF",
  red: "#FF334D",
};

function Part({
  position,
  size,
  color,
  metalness = 0.45,
  roughness = 0.42,
}: {
  position: Vec3;
  size: Vec3;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}
function Clickable({
  position,
  name,
  onSelect,
  children,
}: {
  position: Vec3;
  name: string;
  onSelect: (name: string) => void;
  children: React.ReactNode;
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(name);
      }}
    >
      {children}
    </group>
  );
}
function Beacon({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.2, 12]} />
        <meshStandardMaterial color="#505863" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial
          color={C.red}
          emissive={C.red}
          emissiveIntensity={2.5}
        />
      </mesh>
    </group>
  );
}
function Rack({
  position,
  name,
  onSelect,
  accent = C.purple,
}: {
  position: Vec3;
  name: string;
  onSelect: (name: string) => void;
  accent?: string;
}) {
  return (
    <Clickable position={position} name={name} onSelect={onSelect}>
      <Part
        position={[0, 0.98, 0]}
        size={[0.92, 1.9, 0.82]}
        color="#56616E"
        metalness={0.68}
      />
      <Part
        position={[0, 0.98, 0.43]}
        size={[0.75, 1.66, 0.055]}
        color="#18212C"
        metalness={0.5}
      />
      <Part
        position={[-0.29, 0.98, 0.47]}
        size={[0.035, 1.55, 0.025]}
        color="#8D98A5"
      />
      {[0.38, 0.08, -0.22, -0.52].map((y, i) => (
        <group key={i}>
          <Part
            position={[0.02, 0.98 + y, 0.48]}
            size={[0.48, 0.18, 0.025]}
            color={i === 0 ? "#293847" : "#303A46"}
          />
          <Part
            position={[-0.19, 0.98 + y, 0.5]}
            size={[0.025, 0.07, 0.018]}
            color={accent}
          />
          <Part
            position={[0.14, 0.98 + y, 0.5]}
            size={[0.1, 0.035, 0.018]}
            color={i === 1 ? "#65E6AE" : "#7C8795"}
          />
        </group>
      ))}
      <Part
        position={[0.27, 1.52, 0.49]}
        size={[0.08, 0.035, 0.02]}
        color="#70FFC2"
      />
      <Part position={[0, 0.09, 0]} size={[1.05, 0.18, 0.92]} color="#171C24" />
      <Part position={[0, 2.02, 0]} size={[0.98, 0.07, 0.88]} color="#8793A1" />
    </Clickable>
  );
}
function Generator({
  position,
  name,
  onSelect,
}: {
  position: Vec3;
  name: string;
  onSelect: (name: string) => void;
}) {
  return (
    <Clickable position={position} name={name} onSelect={onSelect}>
      <Part
        position={[0, 0.78, 0]}
        size={[2.05, 1.48, 1.42]}
        color="#454C56"
        metalness={0.7}
      />
      <Part position={[0, 1.55, 0]} size={[1.9, 0.12, 1.35]} color="#828B96" />
      <Part position={[0, 0.12, 0]} size={[2.25, 0.18, 1.62]} color="#171B21" />
      {Array.from({ length: 9 }, (_, i) => (
        <Part
          key={i}
          position={[-0.72 + i * 0.18, 0.78, 0.73]}
          size={[0.065, 0.86, 0.035]}
          color="#20252C"
        />
      ))}
      <Part
        position={[0.68, 0.93, 0.76]}
        size={[0.25, 0.32, 0.04]}
        color="#0D131A"
      />
      <Part
        position={[0.68, 1.03, 0.79]}
        size={[0.08, 0.08, 0.035]}
        color="#6FFFC0"
      />
    </Clickable>
  );
}
function Transformer({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <Clickable
      position={[7, 0, -0.5]}
      name="Utility Transformer"
      onSelect={onSelect}
    >
      <Part position={[0, 0.14, 0]} size={[3, 0.25, 2.5]} color="#343A43" />
      <Part
        position={[0, 1.15, 0]}
        size={[2.3, 1.75, 1.85]}
        color="#8B949E"
        metalness={0.8}
      />
      {Array.from({ length: 10 }, (_, i) => (
        <Part
          key={i}
          position={[-0.95 + i * 0.21, 1.15, 0.95]}
          size={[0.08, 1.48, 0.07]}
          color="#5C6570"
        />
      ))}
      <Part position={[0, 2.1, 0]} size={[2.5, 0.14, 2.0]} color="#A6AFB8" />
      {[-0.7, -0.25, 0.25, 0.7].map((x) => (
        <mesh key={x} position={[x, 2.34, -0.25]}>
          <cylinderGeometry args={[0.12, 0.15, 0.38, 12]} />
          <meshStandardMaterial color="#A99B86" metalness={0.6} />
        </mesh>
      ))}
    </Clickable>
  );
}

function Dish({
  position,
  onSelect,
}: {
  position: Vec3;
  onSelect: (name: string) => void;
}) {
  const geometry = useMemo(() => {
    const v: number[] = [];
    const idx: number[] = [];
    const rings = 24;
    const segments = 48;
    const radius = 1.75;

    for (let r = 0; r <= rings; r++) {
      const t = r / rings;

      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;

        v.push(
          radius * t * Math.cos(a),
          0.55 * t * t,
          radius * t * Math.sin(a),
        );
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * (segments + 1) + s;
        const b = a + segments + 1;

        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();

    return g;
  }, []);

  return (
    <Clickable
      position={position}
      name="Satellite Dish Antenna"
      onSelect={onSelect}
    >
      {/* Heavy industrial base */}
      <Part position={[0, 0.12, 0]} size={[2.4, 0.22, 2.1]} color="#303943" />

      <Part position={[0, 0.28, 0]} size={[1.45, 0.16, 1.35]} color="#596574" />

      {/* Vertical pedestal */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 1.25, 24]} />
        <meshStandardMaterial
          color="#8996A4"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* Azimuth and elevation adjustment housing */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <boxGeometry args={[0.72, 0.32, 0.62]} />
        <meshStandardMaterial
          color="#465462"
          metalness={0.8}
          roughness={0.32}
        />
      </mesh>

      {/* Main dish assembly */}
      <group position={[0, 1.72, 0]} rotation={[-0.35, 0, -0.2]}>
        {/* Reflector */}
        <mesh
          geometry={geometry}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#DCE4EC"
            metalness={0.88}
            roughness={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.75, 0.045, 10, 64]} />
          <meshStandardMaterial
            color="#8995A2"
            metalness={0.95}
            roughness={0.24}
          />
        </mesh>

        {/* Central rear mounting hub */}
        <mesh position={[0, 0.12, -0.12]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.42, 20]} />
          <meshStandardMaterial
            color="#596775"
            metalness={0.9}
            roughness={0.28}
          />
        </mesh>

        {/* Feed support arms: arranged around the dish centre */}
        {[
          [0, 0.06, 1.28],
          [1.12, 0.06, -0.64],
          [-1.12, 0.06, -0.64],
        ].map((p, i) => (
          <mesh
            key={i}
            position={[p[0] * 0.5, p[1], p[2] * 0.5]}
            rotation={[
              0,
              Math.atan2(p[0], p[2]),
              Math.atan2(p[0], p[2]) * 0.35,
            ]}
            castShadow
          >
            <boxGeometry
              args={[0.065, 0.065, Math.sqrt(p[0] ** 2 + p[2] ** 2)]}
            />
            <meshStandardMaterial
              color="#667583"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        ))}

        {/* Feed arm extension */}
        <mesh position={[0, 0.04, 0.92]} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 0.8, 12]} />
          <meshStandardMaterial
            color="#A5B1BD"
            metalness={0.92}
            roughness={0.25}
          />
        </mesh>

        {/* Feed horn assembly */}
        <group position={[0, 0.04, 1.34]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.16, 0.3, 24]} />
            <meshStandardMaterial
              color="#E4A84F"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Horn opening */}
          <mesh position={[0, 0, 0.16]}>
            <torusGeometry args={[0.14, 0.025, 8, 24]} />
            <meshStandardMaterial
              color="#F6D28A"
              metalness={0.9}
              roughness={0.22}
            />
          </mesh>

          {/* Receiver tip */}
          <mesh position={[0, 0, -0.2]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <meshStandardMaterial
              color="#D4E5F7"
              metalness={0.8}
              roughness={0.2}
              emissive="#174A72"
              emissiveIntensity={0.25}
            />
          </mesh>
        </group>

        {/* Small mounting bolts around the rim */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;

          return (
            <mesh
              key={i}
              position={[1.68 * Math.cos(a), 0.02, 1.68 * Math.sin(a)]}
            >
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial
                color="#53616F"
                metalness={0.95}
                roughness={0.25}
              />
            </mesh>
          );
        })}
      </group>

      {/* Status beacon */}
      <Beacon position={[1.0, 2.05, -0.45]} />
    </Clickable>
  );
}

function SolarArray({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <Clickable position={[-7, 0, 1]} name="Solar Array" onSelect={onSelect}>
      {[-2, 0, 2].map((x) => (
        <Part
          key={x}
          position={[x, 0.55, 0]}
          size={[0.08, 1.1, 0.08]}
          color="#7B8490"
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <group
          key={i}
          position={[
            ((i % 3) - 1) * 1.65,
            1.08,
            (Math.floor(i / 3) - 0.5) * 1.12,
          ]}
          rotation={[-0.2, 0, 0]}
        >
          <Part
            position={[0, 0, 0]}
            size={[1.55, 0.07, 1.02]}
            color={C.solar}
            metalness={0.65}
          />
          {Array.from({ length: 4 }, (_, j) => (
            <Part
              key={j}
              position={[(j - 1.5) * 0.3, 0.04, 0]}
              size={[0.018, 0.012, 0.94]}
              color="#6C9BCB"
              metalness={0.1}
            />
          ))}
        </group>
      ))}
      <Part position={[0, 0.12, 0]} size={[5.5, 0.12, 2.6]} color="#4A515C" />
    </Clickable>
  );
}
function Tower({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <Clickable
      position={[9, 0, -3.4]}
      name="Communications Tower"
      onSelect={onSelect}
    >
      {[-0.42, 0.42].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <Part
            key={`${x}-${z}`}
            position={[x, 2.25, z]}
            size={[0.075, 4.5, 0.075]}
            color="#A1AAB5"
            metalness={0.85}
          />
        )),
      )}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[0, 0.35 + i * 0.62, 0]}>
          <Part
            position={[0, 0, 0.42]}
            size={[0.85, 0.045, 0.045]}
            color="#7E8995"
          />
          <Part
            position={[0, 0, -0.42]}
            size={[0.85, 0.045, 0.045]}
            color="#7E8995"
          />
          <Part
            position={[0.42, 0, 0]}
            size={[0.045, 0.045, 0.85]}
            color="#7E8995"
          />
          <Part
            position={[-0.42, 0, 0]}
            size={[0.045, 0.045, 0.85]}
            color="#7E8995"
          />
        </group>
      ))}
      <Part position={[0, 4.55, 0]} size={[1.1, 0.12, 1.1]} color="#343B46" />
      <Beacon position={[0, 4.75, 0]} />
    </Clickable>
  );
}
function Fence() {
  return (
    <group>
      {Array.from({ length: 25 }, (_, i) => (
        <group key={i}>
          <Part
            position={[-12 + i, 0.72, -7.2]}
            size={[0.035, 1.44, 0.035]}
            color="#727E8A"
          />
          <Part
            position={[-12 + i, 0.72, 7.2]}
            size={[0.035, 1.44, 0.035]}
            color="#727E8A"
          />
        </group>
      ))}
      {[-7.2, 7.2].map((z) => (
        <Part
          key={z}
          position={[0, 0.45, z]}
          size={[24, 0.035, 0.035]}
          color="#828D99"
        />
      ))}
      {[-12, 12].map((x) => (
        <Part
          key={x}
          position={[x, 0.45, 0]}
          size={[0.035, 0.035, 14.4]}
          color="#828D99"
        />
      ))}
    </group>
  );
}

function Building({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <group>
      {/* Raised concrete foundation */}
      <Part
        position={[0, 0.24, -0.3]}
        size={[9.8, 0.48, 7.5]}
        color="#444B55"
      />

      {/* Main building - remains selectable */}
      <Clickable
        position={[0, 2.15, -0.3]}
        name="Ground Station Building"
        onSelect={onSelect}
      >
        {/* Front wall - left section */}
        <Part
          position={[-3.35, 0, 3.4]}
          size={[2.3, 3.4, 0.12]}
          color={C.building}
        />

        {/* Front wall - right section */}
        <Part
          position={[3.35, 0, 3.4]}
          size={[2.3, 3.4, 0.12]}
          color={C.building}
        />

        {/* Front wall - below window */}
        <Part
          position={[-0.1, -1.25, 3.4]}
          size={[4.5, 0.9, 0.12]}
          color={C.building}
        />

        {/* Front wall - above window */}
        <Part
          position={[-0.1, 1.35, 3.4]}
          size={[4.5, 0.7, 0.12]}
          color={C.building}
        />

        {/* Left side wall */}
        <Part
          position={[-4.45, 0, 0]}
          size={[0.12, 3.4, 6.8]}
          color={C.building}
        />

        {/* Right side wall */}
        <Part
          position={[4.45, 0, 0]}
          size={[0.12, 3.4, 6.8]}
          color={C.building}
        />

        {/* Rear wall */}
        <Part
          position={[0, 0, -3.35]}
          size={[9, 3.4, 0.12]}
          color={C.building}
        />
      </Clickable>

      {/* Front facade vertical panel seams */}
      {Array.from({ length: 13 }, (_, i) => (
        <Part
          key={`seam-${i}`}
          position={[-4.25 + i * 0.71, 2.15, 3.13]}
          size={[0.025, 3.15, 0.03]}
          color="#656D78"
        />
      ))}

      {/* Control-room windows */}
      {[-3.1, -2, -0.9].map((x) => (
        <group key={x} position={[x, 2.05, 3.18]}>
          {/* Window frame */}
          <Part
            position={[0, 0, 0]}
            size={[0.98, 1.72, 0.12]}
            color="#303B48"
            metalness={0.8}
          />

          {/* Glazing */}
          <Part
            position={[0, 0, 0.07]}
            size={[0.82, 1.52, 0.035]}
            color={C.glass}
            metalness={0.65}
          />

          {/* Vertical and horizontal mullions */}
          <Part
            position={[0, 0, 0.095]}
            size={[0.035, 1.52, 0.025]}
            color="#B5C0CC"
          />
          <Part
            position={[0, 0, 0.095]}
            size={[0.82, 0.035, 0.025]}
            color="#B5C0CC"
          />

          {/* Window sill */}
          <Part
            position={[0, -0.9, 0.06]}
            size={[1.05, 0.08, 0.2]}
            color="#778492"
          />
        </group>
      ))}

      {/* Main access door */}
      <Clickable
        position={[2.2, 1.55, 3.2]}
        name="Main Access Door"
        onSelect={onSelect}
      >
        <Part position={[0, 0, 0]} size={[1.7, 2.35, 0.12]} color="#9099A4" />

        {/* Door frame */}
        <Part
          position={[-0.84, 0, 0.045]}
          size={[0.09, 2.45, 0.08]}
          color="#303B48"
        />
        <Part
          position={[0.84, 0, 0.045]}
          size={[0.09, 2.45, 0.08]}
          color="#303B48"
        />
        <Part
          position={[0, 1.2, 0.045]}
          size={[1.75, 0.09, 0.08]}
          color="#303B48"
        />

        {/* Horizontal door reinforcement ribs */}
        {Array.from({ length: 13 }, (_, i) => (
          <Part
            key={i}
            position={[0, -1.05 + i * 0.17, 0.08]}
            size={[1.62, 0.018, 0.018]}
            color="#555E69"
          />
        ))}

        {/* Handle */}
        <Part
          position={[0.58, 0, 0.105]}
          size={[0.07, 0.3, 0.035]}
          color="#E0B45D"
          metalness={0.8}
        />

        {/* Access card reader */}
        <Part
          position={[0.98, 0.25, 0.08]}
          size={[0.13, 0.24, 0.06]}
          color="#202B36"
        />
        <Part
          position={[0.98, 0.3, 0.12]}
          size={[0.045, 0.035, 0.015]}
          color="#38E8A5"
        />
      </Clickable>

      {/* Front wall ventilation louvers */}
      <group position={[3.75, 2.0, 3.22]}>
        <Part position={[0, 0, 0]} size={[0.85, 0.75, 0.1]} color="#303B48" />
        {Array.from({ length: 7 }, (_, i) => (
          <Part
            key={i}
            position={[0, -0.27 + i * 0.09, 0.07]}
            size={[0.72, 0.035, 0.06]}
            color="#9AA6B2"
            metalness={0.75}
          />
        ))}
      </group>

      {/* Wall-mounted security lights */}
      {[-3.9, 0, 3.9].map((x) => (
        <group key={`light-${x}`} position={[x, 3.45, 3.22]}>
          <Part
            position={[0, 0, 0]}
            size={[0.32, 0.18, 0.16]}
            color="#293541"
          />
          <mesh position={[0, -0.045, 0.095]}>
            <boxGeometry args={[0.22, 0.075, 0.035]} />
            <meshStandardMaterial
              color="#D9F2FF"
              emissive="#78CFFF"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}

      {/* Roof slab */}
      <Part
        position={[0, 3.92, -0.3]}
        size={[9.5, 0.25, 7.1]}
        color="#5E6874"
        metalness={0.75}
      />

      {/* Roof perimeter trim */}
      <Part
        position={[0, 4.08, -3.8]}
        size={[9.35, 0.15, 0.12]}
        color="#89939E"
      />
      <Part
        position={[0, 4.08, 3.18]}
        size={[9.35, 0.15, 0.12]}
        color="#89939E"
      />
      <Part
        position={[-4.65, 4.08, -0.3]}
        size={[0.12, 0.15, 7.0]}
        color="#89939E"
      />
      <Part
        position={[4.65, 4.08, -0.3]}
        size={[0.12, 0.15, 7.0]}
        color="#89939E"
      />

      {/* Purple illuminated roof edge */}
      <Part
        position={[0, 3.8, 3.23]}
        size={[8.2, 0.045, 0.05]}
        color={C.purple}
      />

      {/* Rooftop HVAC platform */}
      <Part
        position={[2.65, 4.18, -1.9]}
        size={[2.35, 0.12, 1.7]}
        color="#3D4854"
      />

      {/* HVAC main housing */}
      <Part
        position={[2.65, 4.55, -1.9]}
        size={[1.85, 0.65, 1.25]}
        color="#A8B3BE"
        metalness={0.65}
      />

      {/* HVAC top cover */}
      <Part
        position={[2.65, 4.91, -1.9]}
        size={[1.95, 0.08, 1.35]}
        color="#D0D7DF"
        metalness={0.75}
      />

      {/* HVAC front ventilation grille */}
      <Part
        position={[2.65, 4.55, -1.255]}
        size={[1.5, 0.43, 0.035]}
        color="#263442"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <Part
          key={`hvac-${i}`}
          position={[1.98 + i * 0.17, 4.55, -1.22]}
          size={[0.035, 0.38, 0.025]}
          color="#8796A5"
        />
      ))}

      {/* HVAC fan housings */}
      {[-0.43, 0.43].map((x) => (
        <group key={x} position={[2.65 + x, 4.96, -1.9]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.045, 24]} />
            <meshStandardMaterial color="#465462" metalness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.025, 8, 24]} />
            <meshStandardMaterial color="#D2DAE2" metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Exhaust stacks */}
      {[
        [0.1, -2.25],
        [0.75, -2.25],
      ].map(([x, z], i) => (
        <group key={`exhaust-${i}`} position={[x, 4.2, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.16, 0.6, 16]} />
            <meshStandardMaterial
              color="#778592"
              metalness={0.85}
              roughness={0.32}
            />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 16]} />
            <meshStandardMaterial color="#414D59" metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Rooftop communications cabinet */}
      <Part
        position={[-3.45, 4.48, -1.8]}
        size={[1.0, 0.62, 0.85]}
        color="#354554"
        metalness={0.65}
      />
      <Part
        position={[-3.45, 4.48, -1.35]}
        size={[0.72, 0.4, 0.035]}
        color="#647686"
        metalness={0.75}
      />

      {/* Cabinet status indicators */}
      {["#38E8A5", "#4CA8FF", "#F5BD4F"].map((color, i) => (
        <mesh key={color} position={[-3.68 + i * 0.22, 4.58, -1.32]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}

      {/* Small roof cable conduits */}
      {[-2.6, -1.9, -1.2].map((x) => (
        <Part
          key={`conduit-${x}`}
          position={[x, 4.17, -0.1]}
          size={[0.055, 0.055, 2.1]}
          color="#252F39"
          metalness={0.6}
        />
      ))}

      {/* Existing satellite dish - retained */}
      <Dish position={[-0.25, 4.05, -0.65]} onSelect={onSelect} />
    </group>
  );
}

function ControlRoom() {
  return (
    <group>
      {/* Interior floor */}
      <Part
        position={[0, 0.55, 1.65]}
        size={[7.8, 0.12, 2.5]}
        color="#202B38"
      />

      {/* Floor lighting strips */}
      {[-3.5, 3.5].map((x) => (
        <Part
          key={x}
          position={[x, 0.63, 1.65]}
          size={[0.045, 0.025, 2.2]}
          color="#43D9FF"
        />
      ))}

      {/* Back wall display panels */}
      <Part
        position={[0, 2.15, -2.65]}
        size={[7.7, 2.5, 0.12]}
        color="#253443"
      />

      {/* Large monitoring screens */}
      {[-2.65, -0.9, 0.9, 2.65].map((x, i) => (
        <group key={x} position={[x, 2.35, -2.55]}>
          {/* Screen frame */}
          <Part
            position={[0, 0, 0]}
            size={[1.45, 1.05, 0.12]}
            color="#111B28"
          />

          {/* Display */}
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[1.32, 0.91, 0.025]} />
            <meshStandardMaterial
              color="#09243A"
              emissive={i % 2 === 0 ? "#0878C9" : "#5633B8"}
              emissiveIntensity={0.8}
              roughness={0.25}
            />
          </mesh>

          {/* Simulated chart bars */}
          {Array.from({ length: 6 }, (_, j) => (
            <Part
              key={j}
              position={[-0.48 + j * 0.19, -0.22 + (j % 3) * 0.08, 0.1]}
              size={[0.09, 0.12 + (j % 3) * 0.12, 0.018]}
              color={j % 2 === 0 ? "#39E8D0" : "#68A8FF"}
            />
          ))}

          {/* Screen status line */}
          <Part
            position={[0, 0.31, 0.1]}
            size={[0.85, 0.025, 0.018]}
            color="#8EBAFF"
          />
        </group>
      ))}

      {/* Server rack row */}
      {[-3.1, -1.65, 1.65, 3.1].map((x, rackIndex) => (
        <group key={x} position={[x, 1.45, 0.25]}>
          {/* Rack cabinet */}
          <Part
            position={[0, 0, 0]}
            size={[1.05, 1.65, 0.8]}
            color="#101923"
            metalness={0.65}
          />

          {/* Front panel */}
          <Part
            position={[0, 0, 0.42]}
            size={[0.9, 1.52, 0.04]}
            color="#263545"
          />

          {/* Rack server units */}
          {Array.from({ length: 6 }, (_, i) => (
            <group key={i} position={[0, -0.62 + i * 0.24, 0.45]}>
              <Part
                position={[0, 0, 0]}
                size={[0.78, 0.16, 0.035]}
                color="#35495B"
              />

              {/* Server status lights */}
              {["#37E8A4", i % 2 === 0 ? "#4BAAFF" : "#F4BE53"].map(
                (color, j) => (
                  <mesh key={j} position={[-0.28 + j * 0.12, 0, 0.025]}>
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshStandardMaterial
                      color={color}
                      emissive={color}
                      emissiveIntensity={1.6}
                    />
                  </mesh>
                ),
              )}

              {/* Ventilation slots */}
              {Array.from({ length: 4 }, (_, j) => (
                <Part
                  key={j}
                  position={[0.08 + j * 0.1, 0, 0.025]}
                  size={[0.055, 0.055, 0.015]}
                  color="#111923"
                />
              ))}
            </group>
          ))}

          {/* Rack top indicator */}
          <mesh position={[0, 0.86, 0.2]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial
              color={rackIndex % 2 === 0 ? "#37E8A4" : "#4BAAFF"}
              emissive={rackIndex % 2 === 0 ? "#37E8A4" : "#4BAAFF"}
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}

      {/* Main illuminated control desk */}
      <Part
        position={[0, 1.0, 1.25]}
        size={[4.3, 0.22, 0.85]}
        color="#465566"
        metalness={0.7}
      />

      {/* Desk front panel */}
      <Part
        position={[0, 0.78, 1.58]}
        size={[4.0, 0.35, 0.12]}
        color="#1B2735"
      />

      {/* Illuminated desk edge */}
      <Part
        position={[0, 1.13, 1.7]}
        size={[4.0, 0.035, 0.035]}
        color="#44D9FF"
      />

      {/* Operator display screens */}
      {[-1.25, 0, 1.25].map((x, i) => (
        <group key={x} position={[x, 1.45, 1.0]}>
          <Part position={[0, 0, 0]} size={[1.0, 0.65, 0.08]} color="#111B28" />

          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.9, 0.55, 0.02]} />
            <meshStandardMaterial
              color="#06213A"
              emissive={i === 1 ? "#5D35D4" : "#087BBF"}
              emissiveIntensity={1.0}
            />
          </mesh>

          <Part
            position={[0, -0.17, 0.07]}
            size={[0.58, 0.025, 0.015]}
            color="#4BE4D3"
          />
        </group>
      ))}

      {/* Keyboard and console control pads */}
      {[-1.3, 0, 1.3].map((x) => (
        <group key={x} position={[x, 1.15, 1.68]}>
          <Part
            position={[0, 0, 0]}
            size={[0.62, 0.035, 0.22]}
            color="#121B26"
          />

          {Array.from({ length: 4 }, (_, i) => (
            <Part
              key={i}
              position={[-0.2 + i * 0.13, 0.025, 0]}
              size={[0.055, 0.015, 0.12]}
              color={i % 2 === 0 ? "#42D9FF" : "#A77BFF"}
            />
          ))}
        </group>
      ))}

      {/* Ceiling light panels */}
      {[-2.4, 0, 2.4].map((x) => (
        <mesh key={x} position={[x, 3.35, 0.1]}>
          <boxGeometry args={[1.3, 0.035, 0.55]} />
          <meshStandardMaterial
            color="#D8F3FF"
            emissive="#79CFFF"
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* Interior ambient illumination */}
      <pointLight
        position={[0, 2.8, 0]}
        color="#398DFF"
        intensity={3}
        distance={8}
      />

      <pointLight
        position={[0, 1.8, 1.2]}
        color="#9A55FF"
        intensity={2}
        distance={5}
      />
    </group>
  );
}

function Ground() {
  return (
    <group>
      {/* Main industrial ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#20252D" roughness={0.88} />
      </mesh>

      {/* Concrete floor panels */}
      {Array.from({ length: 13 }, (_, x) =>
        Array.from({ length: 10 }, (_, z) => (
          <mesh
            key={`${x}-${z}`}
            position={[-15 + x * 2.5, -0.065, -10 + z * 2.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2.46, 2.46]} />
            <meshStandardMaterial
              color={(x + z) % 3 === 0 ? "#303640" : "#262C35"}
              roughness={0.7}
            />
          </mesh>
        )),
      )}

      {/* Yellow safety lines around the equipment zone */}
      {[
        { p: [0, -0.035, 3.35] as Vec3, s: [13, 0.018, 0.07] as Vec3 },
        { p: [0, -0.035, 7.0] as Vec3, s: [13, 0.018, 0.07] as Vec3 },
        { p: [-6.45, -0.035, 5.15] as Vec3, s: [0.07, 0.018, 3.7] as Vec3 },
        { p: [6.45, -0.035, 5.15] as Vec3, s: [0.07, 0.018, 3.7] as Vec3 },
      ].map((line, i) => (
        <Part
          key={i}
          position={line.p}
          size={line.s}
          color="#F5C542"
          metalness={0}
          roughness={0.85}
        />
      ))}

      {/* Service road */}
      <Part
        position={[0, -0.045, 9.2]}
        size={[22, 0.025, 2.5]}
        color="#353B45"
        metalness={0.05}
        roughness={0.8}
      />

      {/* Dashed road center line */}
      {Array.from({ length: 9 }, (_, i) => (
        <Part
          key={i}
          position={[-9 + i * 2.25, -0.025, 9.2]}
          size={[1.05, 0.012, 0.055]}
          color="#E7DDAA"
          metalness={0}
          roughness={0.9}
        />
      ))}

      {/* Yellow-black hazard stripes beside service equipment */}
      {Array.from({ length: 10 }, (_, i) => (
        <Part
          key={i}
          position={[-7.5 + i * 0.3, -0.027, 7.05]}
          size={[0.15, 0.014, 0.24]}
          color={i % 2 === 0 ? "#F5C542" : "#171B21"}
          metalness={0}
          roughness={0.85}
        />
      ))}

      {/* Equipment bay dividers */}
      {[-5.8, -2.2, 2.2, 5.8].map((x) => (
        <Part
          key={x}
          position={[x, -0.03, 5.2]}
          size={[0.025, 0.012, 2.8]}
          color="#68727E"
          metalness={0}
        />
      ))}
    </group>
  );
}

function CableInfrastructure() {
  return (
    <group>
      {/* Raised cable tray behind the equipment racks */}
      <Part
        position={[0, 0.34, 6.0]}
        size={[12.5, 0.12, 0.22]}
        color="#596572"
      />

      {/* Tray side rails */}
      {[-0.13, 0.13].map((z) => (
        <Part
          key={z}
          position={[0, 0.43, 6.0 + z]}
          size={[12.5, 0.12, 0.035]}
          color="#8793A0"
        />
      ))}

      {/* Tray support brackets */}
      {Array.from({ length: 9 }, (_, i) => (
        <Part
          key={i}
          position={[-5.8 + i * 1.45, 0.12, 6.0]}
          size={[0.055, 0.38, 0.055]}
          color="#8793A0"
        />
      ))}

      {/* Colored power and data conduits */}
      {[
        { y: 0.4, color: "#C4A15A" },
        { y: 0.44, color: "#566F91" },
        { y: 0.48, color: "#704D9B" },
      ].map((c, i) => (
        <Part
          key={i}
          position={[0, c.y, 6.0]}
          size={[12.1, 0.035, 0.035]}
          color={c.color}
          metalness={0.25}
        />
      ))}

      {/* Cable drops down to the rack area */}
      {[-5.5, -4.2, -2.9, 2.9, 4.2, 5.5].map((x, i) => (
        <group key={x}>
          <Part
            position={[x, 0.2, 5.75]}
            size={[0.035, 0.35, 0.035]}
            color={i % 2 === 0 ? "#C4A15A" : "#704D9B"}
            metalness={0.2}
          />
          <Part
            position={[x, 0.045, 5.55]}
            size={[0.18, 0.035, 0.28]}
            color="#141920"
          />
        </group>
      ))}

      {/* Main power conduit leading toward the transformer */}
      <Part
        position={[7.0, 0.12, 2.5]}
        size={[0.12, 0.12, 3.5]}
        color="#697785"
      />

      <Part
        position={[7.0, 0.12, 0.75]}
        size={[0.12, 0.12, 0.12]}
        color="#B0BBC6"
      />
    </group>
  );
}

function Floodlight({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Steel pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.12, 6, 12]} />
        <meshStandardMaterial color="#7D8997" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Cross arm */}
      <Part
        position={[0.25, 5.85, 0]}
        size={[0.8, 0.08, 0.12]}
        color="#9AA5B2"
      />

      {/* Lamp housing */}
      <Part
        position={[0.5, 5.8, 0]}
        size={[0.48, 0.18, 0.38]}
        color="#D3DCE5"
        metalness={0.55}
      />

      {/* Glowing lamp */}
      <mesh position={[0.5, 5.69, 0]}>
        <boxGeometry args={[0.36, 0.035, 0.27]} />
        <meshStandardMaterial
          color="#FFF0C7"
          emissive="#FFCA72"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Ground illumination */}
      <pointLight
        position={[0.5, 5.55, 0]}
        color="#FFD9A0"
        intensity={18}
        distance={12}
        decay={2}
      />
    </group>
  );
}

export default function GroundStation({
  onEquipmentSelect,
}: {
  onEquipmentSelect: (equipment: string) => void;
}) {
  return (
    <>
      <color attach="background" args={[C.sky]} />
      <fog attach="fog" args={[C.sky, 50, 100]} />

      <ambientLight intensity={0.65} color="#B9C9E2" />

      <pointLight
        position={[0, 7, 2.5]}
        color="#9C4DFF"
        intensity={12}
        distance={14}
        decay={2}
      />

      <hemisphereLight args={["#7189B0", "#24232B", 0.9]} />

      <directionalLight
        position={[-12, 20, 10]}
        intensity={2.2}
        color="#E0E8F4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <directionalLight
        position={[8, 12, -10]}
        intensity={1.2}
        color="#9CB8E7"
      />

      <Ground />
      <group position={[0, -1.35, -0.3]}>
        <ControlRoom />
      </group>

      <CableInfrastructure />

      <Floodlight position={[-11, 0, -5]} />
      <Floodlight position={[11, 0, -5]} />
      <Floodlight position={[-11, 0, 6]} />
      <Floodlight position={[11, 0, 6]} />

      <Building onSelect={onEquipmentSelect} />

      {/* Power generation zone */}
      <SolarArray onSelect={onEquipmentSelect} />

      <Generator
        position={[-8, 0, 4]}
        name="Backup Generator A"
        onSelect={onEquipmentSelect}
      />

      <Generator
        position={[-8, 0, 6.5]}
        name="Backup Generator B"
        onSelect={onEquipmentSelect}
      />

      <Transformer onSelect={onEquipmentSelect} />
      <Tower onSelect={onEquipmentSelect} />

      {/* Equipment racks — spaced apart */}
      <Rack position={[-5.5, 0, 5]} name="RF TX" onSelect={onEquipmentSelect} />
      <Rack position={[-4.2, 0, 5]} name="RF RX" onSelect={onEquipmentSelect} />
      <Rack position={[-2.9, 0, 5]} name="MODEM" onSelect={onEquipmentSelect} />

      <Rack
        position={[2.9, 0, 5]}
        name="NETWORK"
        onSelect={onEquipmentSelect}
      />
      <Rack
        position={[4.2, 0, 5]}
        name="SERVERS"
        onSelect={onEquipmentSelect}
      />
      <Rack
        position={[5.5, 0, 5]}
        name="MONITOR"
        onSelect={onEquipmentSelect}
      />

      <Fence />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={12}
        maxDistance={48}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 2, 0]}
      />
    </>
  );
}
