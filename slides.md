---
title: Robots
# try also 'default' to start simple
theme: default
colorSchema: 'light'
# apply any windi css classes to the current slide
class: 'flex row items-center justify-end'
# some information about the slides, markdown enabled
info: |
  ## A demo of Three.js with slidev

canvasWidth: 1080

layout: default
drawings:
  persist: false
---

<div class="text-center pt-30 relative" v-if="$slidev.nav.currentPage === 1" v-motion-slide-left>
  <h3>Made by <a href="https://github.com/leone25">Enrico</a></h3>
  <h1>Robots</h1>
  <p><i>≪Cool stuff≫</i></p>
</div>

---
layout: default
---
<div v-if="$slidev.nav.currentPage === 2" v-motion-slide-left>
  <h1>Here is why i love robots</h1>
  <ul>
    <li key=0>They are cool</li>
    <li key=1>They are smart</li>
    <li key=2>They move</li>
    <li key=3>They make nice noises</li>
    <li key=4>They are cool(again)</li>
  </ul>
</div>

---
layout: default
class: 'flex row justify-start'
---

<div v-if="$slidev.nav.currentPage === 3" v-motion-slide-left>
  <h1>Noises they make</h1>
  <ul>
    <li>ziiiii</li>
    <li>zoooooo</li>
    <li>weeeeee</li>
    <li>woooooo</li>
    <li>trrrrrrr (that is often not a good noise)</li>
  </ul>
</div>

---
layout: default
class: 'flex row justify-end'
---

<div v-if="$slidev.nav.currentPage === 4" v-motion-slide-right>
  <h1>OwO</h1>
  <p>Incwedibwe movig bwocks</p>
</div>

---
layout: default
class: 'flex row justify-end'
---

<div v-if="$slidev.nav.currentPage === 5" v-motion-slide-bottom>
  <h1>UwU</h1>
  <p>Me likey</p>
</div>

---
layout: default
---

<div v-if="$slidev.nav.currentPage === 6" v-motion-slide-right>
  <h1>Video</h1>
  <div class="flex row justify-center">
    I used to have a video here but i removed it for privacy
  </div>
</div>


---
layout: default
---

<div v-if="$slidev.nav.currentPage === 7" v-motion-slide-left>
  <h1>Built with:</h1>
  <ul>
    <li>Slidev</li>
    <li>Three.js</li>
    <li>3d models mostly by Comau</li>
  </ul>
  <img src="/growth.png" alt="growth" class="float-right w-400px" />
</div>

---
layout: cover
class: 'text-center h-full'
---

<div v-if="$slidev.nav.currentPage === 8" v-motion-slide-bottom>
  <h1>THE END</h1>
  <div class="flex row justify-evenly h-200px">
    <img src="/E_logo_white.svg" >
  </div>
</div>
