import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import Layout from './Layout'

class Model {
  constructor() {
    this.mesh = null
  }
  setupMixer(glb) {
    if (!glb?.animations?.length) return

    this.mixer = new THREE.AnimationMixer(glb.scene)

    // Play action
    const action = this.mixer.clipAction(glb.animations[0])
    action.play()
  }

  async load() {
    Layout.toggleSpinner()

    try {
      const { scene } = XR8.Threejs.xrScene()
      const loader = new GLTFLoader()
      const glb = await loader.loadAsync(this.sources[0])
      glb.scene.visible = false
      glb.scene.traverse((child) => {
        if (child.name === 'Node') {
          child.visible = false
        }

        if (child.name === 'Text_Sofa') {
          this.sofaText = child
        }
      })

      scene.add(glb.scene)

      this.setupMixer(glb)

      this.model = glb.scene
    } catch (error) {
      console.error({ error })
      alert('Error: model loading failed.')
    }

    Layout.toggleSpinner()
  }

  reveal(position, rotation, scale) {
    this.model.visible = true
    this.mesh.material = this.createVideoMaterial(this.sources[1])

    this.model.position.copy(position)
    this.model.quaternion.copy(rotation)
    this.model.scale.copy(scale)

    this.mesh.position.copy(position);
    this.mesh.quaternion.copy(rotation);
    this.mesh.scale.copy(scale);
    
    XR8.Threejs.xrScene().scene.add(this.mesh)
  }

  init() {
    this.clock = new THREE.Clock()
    this.mixer = null

    this.sources = [
      '/models/immersaltest.glb',
      '/video/kyoto-takenosato.mp4',
    ]

    this.load()
    const videoTexture = this.createVideoMaterial(this.sources[1])

    const geometry = new THREE.PlaneBufferGeometry(0.2, 0.2)
    const material = new THREE.MeshBasicMaterial({ map: this.videoTexture, side: THREE.DoubleSide, transparent: true })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(1, 0.5, 0) // x, y, zは任意の座標
    this.mesh.visible = true

    XR8.Threejs.xrScene().scene.add(this.mesh);

  }

  update() {
    const delta = this.clock.getDelta()
    this.mixer?.update(delta)

    this.mesh.position.copy(this.model.position);
    this.mesh.quaternion.copy(this.model.quaternion);
    this.mesh.material.map.needsUpdate = true

    const time = this.clock.getElapsedTime()
    if (this.sofaText) {
      this.sofaText.rotation.z -= 0.01
      this.sofaText.position.y = Math.sin(time * 2) * 0.2 - 0.8
    }
    videoTexture.image.play()
  }
  
  createVideoMaterial(videoSrc) {
    
    const video = document.createElement('video')
    const { scene, camera, renderer } = XR8.Threejs.xrScene()
    const videoMaterial = this.createVideoMaterial(this.sources[1])
    video.src = videoSrc
    video.autoplay = true
    video.loop = true
    
    video.play().then(() => {
      const texture = new THREE.VideoTexture(video)
      texture.minFilter = THREE.LinearFilter
      texture.flipY = false
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      material.transparent = true
      return material.map
    }).catch((error) => {
      console.error('Failed to start video playback', error)
    })
    
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.format = THREE.RGBFormat
    videoTexture.needsUpdate = true
  
    const geometry = new THREE.PlaneBufferGeometry(1, 1) // 平面ジオメトリを使用する
    const material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide })
  
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  
    const playVideo = () => {
      video.play()
  }
    // Update function for rendering loop
    const update = () => {
      // Update video texture
      videoTexture.needsUpdate = true
    }
  
    // Add update function to render loop
    const renderLoop = () => {
      update()
      renderer.render(scene, camera)
      requestAnimationFrame(renderLoop)
    }
    requestAnimationFrame(renderLoop)
  
    return videoTexture
  }
}

const instance = new Model()
export default instance
