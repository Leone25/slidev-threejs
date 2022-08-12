import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import BezierEasing from 'bezier-easing';

export function background3d(t, file) {
  let ctx = {
    canvas: t.$refs.canvas
  };

  let ti = t;

  /*
    {
      objectTreeElement: el,
      from: {},
      to: {},
      timeStart: 0,
      timeEnd: 100,
      duration: 100,
      easing: 'linear',
      easingFunction: (0-1) => 0-1,
      index: 0,
    }
  */

  let animations = [];
  let currentSlide = -1;

  window.getAnimations = () => animations;

  ctx.init = () => {
    return new Promise(async (resolve, reject) => {
      console.log('loading scene');
      ctx.objectTree = await fetch(file).then(response => response.json()).catch(error => reject(error));
      console.log('scene settings loaded');
      ctx.renderer = new THREE.WebGLRenderer({
        canvas: ctx.canvas,
        antialias: true,
      });
      if (ctx.objectTree.shadows) 
        ctx.renderer.shadowMap.enabled = true;
      ctx.scene = new THREE.Scene();
      ctx.camera = new THREE.PerspectiveCamera(
        ctx.objectTree.camera.fov,
        t.$slidev.configs.aspectRatio, //1.7777777777777777, 
        ctx.objectTree.camera.near,
        ctx.objectTree.camera.far
      );

      ctx.objectTree.camera.element = ctx.camera;

      // do not put this later otherwise it's gonna mess with the camera position and rotation
      new OrbitControls(ctx.camera, ctx.renderer.domElement);

      ctx.camera.position.fromArray(ctx.objectTree.camera.position);
      ctx.camera.rotation.fromArray(ctx.objectTree.camera.rotation);
      window.addEventListener('resize', () => {
        updateSize();
      }, false);
      updateSize();

      window.camera = ctx.camera;

      

      if (ctx.objectTree.helpers) 
        ctx.scene.add(new THREE.GridHelper( 100, 100 ));

      const objLoader = new OBJLoader();
      function loadObj(url) {
        return new Promise(async (resolve, reject) => {
          objLoader.load(
            url,
            resolve,
            () => {},
            reject
          );
        });
      }

      const svgLoader = new SVGLoader();
      function loadSvg(url) {
        return new Promise(async (resolve, reject) => {
          svgLoader.load(
            url,
            resolve,
            () => {},
            reject
          );
        });
      }

      const fontLoader = new FontLoader();
      function loadFont(url) {
        return new Promise(async (resolve, reject) => {
          fontLoader.load(
            url,
            resolve,
            () => {},
            reject
          );
        });
      }

      async function iterate(o, parent) {
        //console.log(o, parent);
        for (let i in o) {
          let object = o[i];
          switch (object.type) {
            case 'plane':
              object.material.material = generateMaterial(object.material);
              object.element = new THREE.Mesh(
                new THREE.PlaneGeometry(... object.size),
                object.material.material
              );
              break;
            case 'box':
              object.material.material = generateMaterial(object.material);
              object.element = new THREE.Mesh(
                new THREE.BoxGeometry(... object.size),
                object.material.material
              );
              break;
            case 'icosahedron':
              object.material.material = generateMaterial(object.material);
              object.element = new THREE.Mesh(
                new THREE.IcosahedronGeometry(object.radius, object.detail),
                object.material.material
              );
              break;
            case 'text':
              object.material.material = generateMaterial(object.material);
              object.element = new THREE.Mesh(
                new TextGeometry(object.text, {
                  font: await loadFont(object.font),
                  size: object.size,
                  height: object.height,
                  curveSegments: object.curveSegments,
                  bevelEnabled: object.bevelEnabled,
                  bevelThickness: object.bevelThickness,
                  bevelSize: object.bevelSize
                }),
                object.material.material
              );
              break;
            case 'object':
              object.material.material = generateMaterial(object.material);
              object.element = await loadObj(object.url);
              object.element.children.forEach(child => {
                child.material = object.material.material;
                if (object.castShadow) child.castShadow = true;
                if (object.receiveShadow) child.receiveShadow = true;
              });
              break;
            case 'extruded2d':
              object.material.material = generateMaterial(object.material);
              let data = await loadSvg(object.url);
		          const group = new THREE.Group();
              data.paths.forEach(path => {
                SVGLoader.createShapes(path).forEach(shape => {
                  let mesh = new THREE.Mesh( 
                    new THREE.ExtrudeGeometry( 
                      shape, 
                      object.extrudeSettings 
                    ), 
                    object.material.material 
                  );
                  if (object.castShadow) mesh.castShadow = true;
                  if (object.receiveShadow) mesh.receiveShadow = true;
                  mesh.position.x = 0-data.xml.getAttribute("width")/2;
                  mesh.position.y = 0-data.xml.getAttribute("height")/2;
                  group.add( mesh );
                });
              });
              object.element = group;
              break;
            case 'group':
              object.element = new THREE.Group();
              break;
            case 'directionalLight':
              object.element = new THREE.DirectionalLight(new THREE.Color(...object.color), object.intensity);
              object.element.shadow.radius = object.shadowRadius;
              break;
            case 'ambientLight':
              object.element = new THREE.AmbientLight(new THREE.Color(...object.color), object.intensity);
              break;
            case 'pointLight':
              object.element = new THREE.PointLight(new THREE.Color(...object.color), object.intensity, object.distance, object.decay);
              object.element.shadow.radius = object.shadowRadius;
              if (ctx.objectTree.helpers) {
                ctx.scene.add(new THREE.PointLightHelper( object.element, 1 ));
              }
              break;
            case 'spotLight':
              object.element = new THREE.SpotLight(new THREE.Color(...object.color), object.intensity);
              object.element.angle = object.angle;
              object.element.penetration = object.penetration;
              object.element.distance = object.distance;
              break;
            case 'hemisphereLight':
              object.element = new THREE.HemisphereLight(new THREE.Color(...object.color), new THREE.Color(...object.groundColor), object.intensity);
              break;
            default:
              console.log('unknown object type', object.type);
              break;
          }
          if (object.element) {
            if (object.position) object.element.position.set(...object.position);
            if (object.rotation) object.element.rotation.set(...object.rotation);
            if (object.scale) object.element.scale.set(...object.scale);
            if (object.castShadow) object.element.castShadow = true;
            if (object.receiveShadow) object.element.receiveShadow = true;
            if (object.children) 
              await iterate(object.children, object.element);
            parent.add(object.element);
          }
        }
      }
      await iterate(ctx.objectTree.objects, ctx.scene);
      
      findNewAnimations(0);
      window.objectTree = ctx.objectTree;

      console.log('scene loaded');
      resolve();
    });
  };
  ctx.animate = (t) => {
    requestAnimationFrame(ctx.animate);

    if (ti.$slidev.nav.currentPage-1 !== currentSlide) {
      currentSlide = ti.$slidev.nav.currentPage-1;
      //console.log(currentSlide);
      
      if (ctx.objectTree.camera.slides && ctx.objectTree.camera.slides[currentSlide]) {
        let copyFrom = ctx.objectTree.camera.slides[currentSlide].copy !== undefined ? ctx.objectTree.camera.slides[currentSlide].copy : currentSlide;
        animations = animations.filter(animation => animation.objectTreeElement !== ctx.objectTree.camera);
        animations.push({
          objectTreeElement: ctx.objectTree.camera,
          timeStart: t,
          timeEnd: t + ctx.objectTree.camera.slides[copyFrom].duration,
          duration: ctx.objectTree.camera.slides[copyFrom].duration,
          easing: ctx.objectTree.camera.slides[copyFrom].easing,
          from: {
            position: ctx.camera.position.toArray(),
            rotation: ctx.camera.rotation.toArray().splice(0, 3),
          },
          to: {
            position: ctx.objectTree.camera.slides[copyFrom].value.position,
            rotation: ctx.objectTree.camera.slides[copyFrom].value.rotation
          }
        });
      }

      // iterate over object tree and check if there are any changes for the current slide and add them to the animations
      function iterate(o) {
        if (o.slides && o.slides[currentSlide]) {
          let copyFrom = o.slides[currentSlide].copy || currentSlide;
          // remove previous animations for this object
          if (o.currentSlide != copyFrom && o.slides) {
            animations = animations.filter(animation => animation.objectTreeElement !== o);
            animations.push({
              objectTreeElement: o,
              timeStart: t,
              timeEnd: t + o.slides[copyFrom].duration,
              duration: o.slides[copyFrom].duration,
              easing: o.slides[copyFrom].easing,
              from: {
                position: o.element.position.toArray(),
                rotation: o.element.rotation.toArray().splice(0, 3),
                scale: o.element.scale.toArray()
              },
              to: {
                position: o.slides[copyFrom].value.position,
                rotation: o.slides[copyFrom].value.rotation,
                scale: o.slides[copyFrom].value.scale,
                visible: o.slides[copyFrom].value.visible
              },
              index: -1,
            });
          }
          o.currentSlide = copyFrom;
          // apply animation to object
          if (o.slides[copyFrom].value.animation !== undefined)
            o.animation = o.slides[copyFrom].value.animation;
        }
        if (o.children)
          o.children.forEach(iterate);
      }
      ctx.objectTree.objects.forEach(iterate);
      
      findNewAnimations(t);

      //console.log(animations);
    }

    

    updateAnimationsList(t || 0);

    function getEasingFunction(transition) {
      switch (transition) {
        case 'linear':
          return (t) => t;
        case 'snap':
          return (t) => t < 0.5 ? 0 : 1;
        case 'ease':
          return BezierEasing(0.25, 0.1, 0.25, 1);
        case 'easeIn':
          return BezierEasing(0.42, 0, 1, 1);
        case 'easeOut':
          return BezierEasing(0, 0, 0.58, 1);
        case 'easeInOut':
          return BezierEasing(0.42, 0, 0.58, 1);
        case 'easeInSine':
          return BezierEasing(0.47, 0, 0.745, 0.715);
        case 'easeOutSine':
          return BezierEasing(0.39, 0.575, 0.565, 1);
        case 'easeInOutSine':
          return BezierEasing(0.445, 0.05, 0.55, 0.95);
        case 'easeInQuad':
          return BezierEasing(0.55, 0.085, 0.68, 0.53);
        case 'easeOutQuad':
          return BezierEasing(0.25, 0.46, 0.45, 0.94);
        case 'easeInOutQuad':
          return BezierEasing(0.455, 0.03, 0.515, 0.955);
        case 'easeInCubic':
          return BezierEasing(0.55, 0.055, 0.675, 0.19);
        case 'easeOutCubic':
          return BezierEasing(0.215, 0.61, 0.355, 1);
        case 'easeInOutCubic':
          return BezierEasing(0.645, 0.045, 0.355, 1);
        case 'easeInQuart':
          return BezierEasing(0.895, 0.03, 0.685, 0.22);
        case 'easeOutQuart':
          return BezierEasing(0.165, 0.84, 0.44, 1);
        case 'easeInOutQuart':
          return BezierEasing(0.77, 0, 0.175, 1);
        case 'easeInQuint':
          return BezierEasing(0.755, 0.05, 0.855, 0.06);
        case 'easeOutQuint':
          return BezierEasing(0.23, 1, 0.32, 1);
        case 'easeInOutQuint':
          return BezierEasing(0.86, 0, 0.07, 1);
        case 'easeInExpo':
          return BezierEasing(0.95, 0.05, 0.795, 0.035);
        case 'easeOutExpo':
          return BezierEasing(0.19, 1, 0.22, 1);
        case 'easeInOutExpo':
          return BezierEasing(0.85, 0, 0.15, 1);
        case 'easeInCirc':
          return BezierEasing(0.6, 0.04, 0.98, 0.335);
        case 'easeOutCirc':
          return BezierEasing(0.075, 0.82, 0.165, 1);
        case 'easeInOutCirc':
          return BezierEasing(0.785, 0.135, 0.15, 0.86);
        case 'easeInBack':
          return BezierEasing(0.6, -0.28, 0.735, 0.045);
        case 'easeOutBack':
          return BezierEasing(0.175, 0.885, 0.32, 1.275);
        case 'easeInOutBack':
          return BezierEasing(0.68, -0.55, 0.265, 1.55);
        case 'easeInBounce':
          return BezierEasing(0.55, 0.055, 0.675, 0.19);
        case 'easeOutBounce':
          return BezierEasing(0.215, 0.61, 0.355, 1);
        case 'easeInOutBounce':
          return BezierEasing(0.68, -0.55, 0.265, 1.55);
        case 'sine':
          return BezierEasing(0.47, 0, 0.745, 0.715);
        default:
          if (/^cubic-bezier\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)$/.test(transition.trim())) {
            const [, x1, y1, x2, y2] = /^cubic-bezier\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)$/.exec(transition.trim());
            return BezierEasing(parseFloat(x1), parseFloat(y1), parseFloat(x2), parseFloat(y2));
          }
          return (t) => t;
      }
    }

    function applyValue(from, to, v) {
      return from + (to - from) * v;
    }

    //console.log(animations[0]);

    animations.forEach(a => {
      let p = (t - a.timeStart) / a.duration;
      if (!a.easingFunction) a.easingFunction = getEasingFunction(a.easing);
      if (p > 1) p = 1;
      if (p < 0) p = 0;
      let v = a.easingFunction(p);
      if (a.from.position && a.to.position) {
        a.objectTreeElement.element.position.fromArray([
          applyValue(a.from.position[0], a.to.position[0], v),
          applyValue(a.from.position[1], a.to.position[1], v),
          applyValue(a.from.position[2], a.to.position[2], v)
        ]);
      }
      if (a.from.rotation && a.to.rotation) {
        a.objectTreeElement.element.rotation.fromArray([
          applyValue(a.from.rotation[0], a.to.rotation[0], v),
          applyValue(a.from.rotation[1], a.to.rotation[1], v),
          applyValue(a.from.rotation[2], a.to.rotation[2], v)
        ]);
      }
      if (a.from.scale && a.to.scale) {
        a.objectTreeElement.element.scale.fromArray([
          applyValue(a.from.scale[0], a.to.scale[0], v),
          applyValue(a.from.scale[1], a.to.scale[1], v),
          applyValue(a.from.scale[2], a.to.scale[2], v)
        ]);
      }

    });

    ctx.renderer.render(ctx.scene, ctx.camera);
  };
  /*function updateSize() {
    ctx.camera.aspect = 1.7777777777777777;
    ctx.camera.updateProjectionMatrix();

    ctx.renderer.setSize(1080, 1080 / 1.7777777777777777);
  };*/
  function updateSize() {
    ctx.camera.aspect = t.$slidev.configs.aspectRatio;
    ctx.camera.updateProjectionMatrix();

    ctx.renderer.setSize(t.$slidev.configs.canvasWidth, t.$slidev.configs.canvasWidth / t.$slidev.configs.aspectRatio);
  };
  function findNewAnimations(time) {
    function iterate(o) {
      if (o.animation && animations.find(a => a.objectTreeElement.element.id === o.element.id) === undefined) {
        animations.push({
          objectTreeElement: o,
          timeStart: time,
          timeEnd: time + o.animation[0].duration,
          duration: o.animation[0].duration,
          easing: o.animation[0].easing,
          from: {
            position: o.element.position.toArray(),
            rotation: o.element.rotation.toArray().splice(0, 3),
            scale: o.element.scale.toArray(),
            visible: o.element.visible
          },
          to: {
            position: o.animation[0].value.position,
            rotation: o.animation[0].value.rotation,
            scale: o.animation[0].value.scale,
            visible: o.animation[0].value.visible
          },
          index: 0,
        });
      }

      if (o.children)
        o.children.forEach(iterate);
    }
    ctx.objectTree.objects.forEach(iterate);
  }
  function updateAnimationsList(time) {
    let toUpdate;
    do {
      toUpdate = [];
      [animations, toUpdate] = animations.reduce(([p, f], e) => (e.timeEnd > time ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
      toUpdate.forEach(e => {
        if (e.to.visible !== null) e.objectTreeElement.element.visible = e.to.visible;
        if (!e.objectTreeElement.animation || e.index == null) {
          if (e.to.position) e.objectTreeElement.element.position.fromArray(e.to.position);
          if (e.to.rotation) e.objectTreeElement.element.rotation.fromArray(e.to.rotation);
          if (e.to.scale) e.objectTreeElement.element.scale.fromArray(e.to.scale);
          return;
        };
        e.index = (e.index + 1) % e.objectTreeElement.animation.length;
        animations.push({
          objectTreeElement: e.objectTreeElement,
          from: Object.create(e.to),
          to: computeChanges(Object.create(e.from), e.objectTreeElement.animation[e.index].value),
          timeStart: e.timeEnd,
          timeEnd: e.timeEnd + e.objectTreeElement.animation[e.index].duration,
          duration: e.objectTreeElement.animation[e.index].duration,
          easing: e.objectTreeElement.animation[e.index].easing,
          index: e.index,
        });
      });
    } while (toUpdate.length > 0);
  }
  function computeChanges(a, b) {
    return {...a, ...b};
  }
  function generateMaterial(material) {
    let options = {
      color: new THREE.Color(...material.color),
      wireframe: material.wireframe,
    };
    switch (material.type) {
      case 'basic':
        return new THREE.MeshBasicMaterial(options);
      case 'lambert':
        return new THREE.MeshLambertMaterial(options);
      case 'phong':
        return new THREE.MeshPhongMaterial(options);
      case 'standard':
        return new THREE.MeshStandardMaterial(options);
      case 'physical':
        return new THREE.MeshPhysicalMaterial(options);
      case 'toon':
        return new THREE.MeshToonMaterial(options);
      case 'normal':
        return new THREE.MeshNormalMaterial(options);
      case 'depth':
        return new THREE.MeshDepthMaterial(options);
      case 'distance':
        return new THREE.MeshDistanceMaterial(options);
      case 'matcap':
        return new THREE.MeshMatcapMaterial(options);
    }
  }
  return ctx;
}