<template>
  <svg width="600" height="100">
    <g class="chart" transform="translate(50, 0)">
    </g>
  </svg>

</template>

<script>
import * as d3 from "d3";

export default {
  name: 'App',
  mounted() {
    const myData = [40, 10, 20, 60, 30];

    d3.select('.chart')
          .selectAll('circle')
        .data(myData)
        .join('circle')
        .attr('cx', function(d, i) {
          return i * 100;
        })
        .attr('cy', 60)
        .attr('r', function(d) {
          return 0.5 * d;
        })
        .style('fill', 'orange');

  }
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
</style>
