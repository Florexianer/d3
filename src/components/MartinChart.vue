<template>
  <div v-html="htmlContent"></div>
</template>

<script>

export default {
  name: "MartinChart",
  props: {
    htmlContent: {
      type: String,
      required: true
    },
  }
}
</script>

<style scoped>

</style>