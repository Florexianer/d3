<template>
  <div style="display:flex; justify-content: space-between; align-items:center; width: 500px; margin: auto">
    <router-link to="/">Home</router-link>
    <router-link to="flo">Flo</router-link>
    <a href="/martin.html">Martin</a>
    <a href="/hadi.html">Hadi</a>
  </div>
<router-view></router-view>
</template>

<script>

export default {
  name: 'App',
  components: {},

}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

* {
  font-family: Helvetica, Arial, sans-serif;
}
</style>
