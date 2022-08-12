<!-- global-bottom.vue -->
<script>
import { background3d } from './animate'

  export default {
    data() {
      return {
        loading: true,
      }
    },
    mounted() {
      let ctx = background3d(this, './background.json')
      ctx.init().then(() => {
        ctx.animate(0);
        this.loading = false;
      });
    },
  }
</script>


<template>
  <div class="absolute top-0 left-0 -z-5 p-0">
    <canvas ref="canvas"></canvas>
    <div class="loading" v-if="loading"></div>
  </div>
</template>