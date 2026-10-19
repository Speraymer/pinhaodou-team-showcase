import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { TEAM } from "./team.js";

function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(72,222,255,.82)");
  gradient.addColorStop(0.48, "rgba(38,104,255,.34)");
  gradient.addColorStop(1, "rgba(0,20,90,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function orbitLine(rx, ry, z, tilt, opacity) {
  const points = [];
  for (let step = 0; step <= 160; step += 1) {
    const angle = (step / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * rx, Math.sin(angle) * ry, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x39c9ff,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.x = tilt;
  return line;
}

function StarScene({ onSelect }) {
  const hostRef = useRef(null);
  const selectRef = useRef(onSelect);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    host.replaceChildren();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.026);
    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 100);
    const initialZoom = host.clientWidth / host.clientHeight < 0.75 ? 35 : 23;
    camera.position.set(0, 0, initialZoom);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x030712, 1);
    renderer.domElement.className = "webgl-canvas";
    renderer.domElement.setAttribute("aria-label", "可拖动旋转的拼好豆成员三维星图");
    host.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.setSize(host.clientWidth, host.clientHeight);
    labels.domElement.className = "labels-layer";
    host.appendChild(labels.domElement);

    const constellation = new THREE.Group();
    scene.add(constellation);
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2400 * 3);
    for (let i = 0; i < starPositions.length; i += 3) {
      const radius = 13 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x9fcad0, size: 0.042, transparent: true, opacity: 0.48 });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    const glow = glowTexture();
    const loader = new THREE.TextureLoader();
    const interactive = [];
    const orbiters = [];
    const avatarTextures = [];

    for (const [index, member] of TEAM.entries()) {
      const featured = Boolean(member.featured);
      const radius = featured ? 1.72 : 0.76;
      const orbit = featured
        ? { rx: 0.14, ry: 0.09, tilt: -0.12, speed: 0.11, phase: 0 }
        : {
            rx: 4.35 + ((index * 1.17) % 3.15),
            ry: 2.05 + ((index * 0.73) % 1.75),
            tiltX: -1.05 + ((index * 0.47) % 2.1),
            tiltY: -0.9 + ((index * 0.61) % 1.8),
            tiltZ: -0.32 + ((index * 0.29) % 0.64),
            speed: (0.055 + index * 0.007) * (index % 2 ? 1 : -1),
            phase: Math.atan2(member.position[1], member.position[0]),
          };
      const orbitRoot = new THREE.Group();
      orbitRoot.rotation.set(
        featured ? orbit.tilt : orbit.tiltX,
        featured ? 0 : orbit.tiltY,
        featured ? 0 : orbit.tiltZ,
      );
      constellation.add(orbitRoot);
      if (!featured) orbitRoot.add(orbitLine(orbit.rx, orbit.ry, 0, 0, 0.12));

      const node = new THREE.Group();
      node.position.set(Math.cos(orbit.phase) * orbit.rx, Math.sin(orbit.phase) * orbit.ry, 0);
      orbitRoot.add(node);

      const aura = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow,
        color: featured ? 0xe6a0b5 : 0x62b8c7,
        transparent: true,
        opacity: featured ? 0.2 : 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      aura.scale.setScalar(radius * (featured ? 2.85 : 2.35));
      node.add(aura);

      const texture = loader.load(member.avatar);
      texture.colorSpace = THREE.SRGBColorSpace;
      avatarTextures.push(texture);
      const portrait = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      portrait.scale.set(radius * 2, radius * 2, 1);
      portrait.userData.member = member;
      node.add(portrait);
      interactive.push(portrait);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.12, radius * 0.042, 12, 96),
        new THREE.MeshBasicMaterial({
          color: featured ? 0xe6a0b5 : 0x62b8c7,
          transparent: true,
          opacity: featured ? 0.62 : 0.4,
          blending: THREE.AdditiveBlending,
        }),
      );
      node.add(ring);

      const labelElement = document.createElement("button");
      labelElement.className = `node-label${featured ? " node-label--featured" : ""}`;
      labelElement.type = "button";
      labelElement.textContent = member.name;
      labelElement.setAttribute("aria-label", `进入 ${member.name} 的主页`);
      labelElement.addEventListener("click", () => selectRef.current(member));
      const label = new CSS2DObject(labelElement);
      label.position.set(0, -radius - (featured ? 0.55 : 0.33), 0);
      node.add(label);
      let connection = null;
      if (!featured) {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), node.position.clone()]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
          color: 0x62b8c7,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
        }));
        orbitRoot.add(line);
        connection = geometry.getAttribute("position");
      }
      orbiters.push({ aura, connection, featured, node, orbit, angle: orbit.phase });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pressing = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let previousX = 0;
    let previousY = 0;
    let targetX = -0.04;
    let targetY = 0;
    let targetZoom = initialZoom;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const locate = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(interactive, false)[0]?.object?.userData?.member;
    };

    const pointerDown = (event) => {
      pressing = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };
    const pointerMove = (event) => {
      if (pressing) {
        const dx = event.clientX - previousX;
        const dy = event.clientY - previousY;
        moved ||= Math.hypot(event.clientX - startX, event.clientY - startY) > 5;
        targetY += dx * 0.006;
        targetX += dy * 0.006;
        previousX = event.clientX;
        previousY = event.clientY;
        return;
      }
      renderer.domElement.style.cursor = locate(event) ? "pointer" : "grab";
    };
    const pointerUp = (event) => {
      if (!pressing) return;
      pressing = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.classList.remove("is-dragging");
      if (!moved) {
        const member = locate(event);
        if (member) selectRef.current(member);
      }
    };
    const pointerCancel = () => {
      pressing = false;
      moved = true;
      renderer.domElement.classList.remove("is-dragging");
    };
    const wheel = (event) => {
      event.preventDefault();
      targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.022, 12, 42);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });

    let frame = 0;
    let lastTime = performance.now();
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!pressing && !reducedMotion) targetY += delta * 0.042;
      constellation.rotation.x += (targetX - constellation.rotation.x) * 0.07;
      constellation.rotation.y += (targetY - constellation.rotation.y) * 0.07;
      camera.position.z += (targetZoom - camera.position.z) * 0.08;
      labels.domElement.style.opacity = String(THREE.MathUtils.clamp((46 - camera.position.z) / 18, 0.35, 1));
      orbiters.forEach((orbiter) => {
        if (!reducedMotion) {
          orbiter.angle += delta * orbiter.orbit.speed;
          orbiter.node.position.set(
            Math.cos(orbiter.angle) * orbiter.orbit.rx,
            Math.sin(orbiter.angle) * orbiter.orbit.ry,
            0,
          );
          if (orbiter.connection) {
            orbiter.connection.setXYZ(1, ...orbiter.node.position.toArray());
            orbiter.connection.needsUpdate = true;
          }
        }
      });
      renderer.render(scene, camera);
      labels.render(scene, camera);
    };
    animate(lastTime);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labels.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      renderer.domElement.removeEventListener("wheel", wheel);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      glow.dispose();
      avatarTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);

  return <div className="star-scene" ref={hostRef} />;
}

function Profile({ member, onClose }) {
  const backRef = useRef(null);

  useEffect(() => {
    if (!member) return undefined;
    backRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;
  return (
    <aside className="profile" role="dialog" aria-modal="true" aria-label={`${member.name} 的个人主页`}>
      <button ref={backRef} className="profile__back" type="button" onClick={onClose}>返回星图</button>
      <div className={`profile__portrait${member.featured ? " profile__portrait--featured" : ""}`}>
        <img src={member.avatar} alt={`${member.name} 的头像`} />
      </div>
      <p className="profile__eyebrow">{member.featured ? "团队主体，位于星图中心" : "拼好豆项目研发部成员"}</p>
      <h2>{member.name}</h2>
      <p className="profile__copy">这里是 {member.name} 的独立主页。返回星图，可以继续查看其他成员。</p>
      <div className="profile__signal"><span />已连接到团队星图</div>
    </aside>
  );
}

export function App() {
  const fromUrl = () => new URLSearchParams(window.location.search).get("member");
  const [selectedSlug, setSelectedSlug] = useState(fromUrl);
  const selected = TEAM.find((member) => member.slug === selectedSlug) || null;
  const returnFocusRef = useRef(null);

  const openProfile = useCallback((member) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const url = new URL(window.location.href);
    url.searchParams.set("member", member.slug);
    window.history.pushState({ memberProfile: true }, "", url);
    setSelectedSlug(member.slug);
  }, []);

  const closeProfile = useCallback(() => {
    if (window.history.state?.memberProfile) window.history.back();
    else {
      const url = new URL(window.location.href);
      url.searchParams.delete("member");
      window.history.replaceState({}, "", url);
    }
    setSelectedSlug(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    const handlePopState = () => setSelectedSlug(fromUrl());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <main className="app-shell">
      <div className="constellation-view" inert={Boolean(selected)}>
        <StarScene onSelect={openProfile} />
        <header className="site-header">
          <div className="site-header__mark" aria-hidden="true" />
          <div>
            <h1><span>拼好豆</span><span>项目研发部</span></h1>
            <p>十位成员，一张可以转动的团队星图。</p>
          </div>
        </header>
        <div className="interaction-note">
          <strong>拖动星图</strong>
          <span>转动视角，滚轮调整远近；选择头像进入主页。</span>
        </div>
        <nav className="member-rail" aria-label="全部成员主页入口">
          {TEAM.map((member) => (
            <button
              className={member.featured ? "is-featured" : ""}
              key={member.slug}
              type="button"
              onClick={() => openProfile(member)}
              aria-label={`进入 ${member.name} 的主页`}
            >
              <img src={member.avatar} alt="" />
              <span>{member.name}</span>
            </button>
          ))}
        </nav>
        <div className="corner-index">10 位成员</div>
      </div>
      <Profile member={selected} onClose={closeProfile} />
    </main>
  );
}
