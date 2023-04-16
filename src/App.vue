<template>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
  <div style="height: 32px;">
    <div @click.prevent="drawStandardGraph" style="cursor:pointer; display:flex; align-items:center;" v-if="detail">
      <div class="material-symbols-outlined" style="font-size: 30px; margin-bottom: 2px;">
        chevron_left
      </div>
      <span style="font-size: 18px;">Back</span>
  </div>
    <div id="chart" style="margin-left: 20px"></div>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: 'App',
  data() {
    return {
      detail: false,
    }
  },
  mounted() {
    this.drawStandardGraph()
  },
  methods: {
    drawStandardGraph() {
      this.detail = false
      d3.select("svg").remove();

      let rawData = this.getData()

      const data = rawData.map(d => {
        const [day, month, year] = d["Start date"].split('/');
        const date = new Date(year, month - 1, day);
        const timeParts = d.Duration.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        return {
          date: date,
          duration: totalSeconds,
          user: d.User
        };
      });

// Set up chart dimensions
      const width = 800;
      const height = 400;
      const margin = { top: 20, right: 80, bottom: 40, left: 80 };

// Create the SVG container
      const svg = d3.select("body")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

      const groupedData = Array.from(d3.group(data, d => d.date.getFullYear() + '-' + (d.date.getMonth() + 1)).values())
          .map(d => {
            const month = new Date(d[0].date);
            month.setDate(1);
            return {
              date: month,
              duration: d3.sum(d, e => e.duration /3600),
            };
          });


// Create the X and Y axes scales
      const xScale = d3.scaleTime()
          .domain(d3.extent(groupedData, d => d.date))
          .range([0, width]);
      const yScale = d3.scaleLinear()
          .domain([0, d3.max(groupedData, d => d.duration)])
          .range([height, 0]);

// Define the line function
      const line = d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d.duration))
          .curve(d3.curveMonotoneX);

// Draw the line chart
      svg.append("path")
          .datum(groupedData)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 3)
          .attr("d", line)
          .on("click", () => this.drawUserGraph(data, groupedData))
          .on("mouseover", function() {
            d3.select(this)
                .attr("stroke-width", 4) // Increase the stroke width on hover
                .attr('cursor', 'pointer');
          })
          .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 3); // Reset the stroke width when the mouse leaves the line
          });


// Add the X and Y axes
      svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%B")))
          .append("text")
          .attr("x", width / 2)
          .attr("y", 35)
          .attr("fill", "black")
          .text("Month");

      svg.append("g")
          .call(d3.axisLeft(yScale))
          .append("text")
          .attr("x", -height / 2)
          .attr("y", -60)
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .text("Hours Worked (Duration)");

      // Add data points with tooltips
      const tooltip = d3.select("body")
          .append("div")
          .style("display","none")
          .style("position", "absolute")
          .style("background-color","rgba(255, 255, 255, 0.5)")
          .style("padding", "4px")
          .style("font-weight","bold")

      svg.selectAll("dot")
          .data(groupedData)
          .enter()
          .append("circle")
          .attr("cx", d => xScale(d.date))
          .attr("cy", d => yScale(d.duration))
          .attr("r", 4)
          .style("fill", "steelblue")
          .on("mouseover", (event, d) => {
            tooltip
                .style("display","block")
                .html(Math.round(d.duration))
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
          })
          .on("mouseout", () => {
            tooltip
                .style("display","none");
          });
    },




    drawUserGraph(data, groupedData) {
      this.detail = true
      d3.select("svg").remove();

      const groupedUserData = d3.rollups(
      data,
      v => d3.sum(v, d => d.duration /3600),
      d => d.user,
      d => d.date.getFullYear() + '-' + (d.date.getMonth() + 1)
      );

      // Set up the new graph dimensions and append the SVG element
      const userGraphWidth = 800;
      const userGraphHeight = 400;
      const userGraphMargin = { top: 20, right: 80, bottom: 40, left: 80 };

      const userSvg = d3.select("body")
          .append("svg")
          .attr("width", userGraphWidth + userGraphMargin.left + userGraphMargin.right)
          .attr("height", userGraphHeight + userGraphMargin.top + userGraphMargin.bottom)
          .append("g")
          .attr("transform", `translate(${userGraphMargin.left}, ${userGraphMargin.top})`);

      // Create the X and Y axes scales for the new graph
      const userXScale = d3.scaleTime()
          .domain(d3.extent(groupedData, d => d.date))
          .range([0, userGraphWidth]);
      const userYScale = d3.scaleLinear()
          .domain([0, d3.max(groupedUserData, d => d3.max(d[1], e => e[1]))])
          .range([userGraphHeight, 0]);

      // Add the X and Y axes to the new graph
      userSvg.append("g")
          .attr("transform", `translate(0, ${userGraphHeight})`)
          .call(d3.axisBottom(userXScale));
      userSvg.append("g")
          .call(d3.axisLeft(userYScale));

      // Create a color scale to assign a unique color to each user
      const colorScale = d3.scaleOrdinal()
          .domain(data.map(d => d.user))
          .range(d3.schemeCategory10);

      const tooltip = d3.select("body")
          .append("div")
          .style("display","none")
          .style("position", "absolute")
          .style("background-color","rgba(255, 255, 255, 0.5)")
          .style("padding", "4px")
          .style("font-weight","bold")

      // Iterate through the grouped data for each user and draw a line with the assigned color
      groupedUserData.forEach(userGroup => {
        const line = d3.line()
            .x(d => userXScale(new Date(d[0])))
            .y(d => userYScale(d[1]))
            .curve(d3.curveMonotoneX);

        userSvg.append("path")
            .datum(userGroup[1])
            .attr("fill", "none")
            .attr("stroke", colorScale(userGroup[0])) // Use the color scale to assign a color to each user
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add the user's name at the end of the line
        const lastDataPoint = userGroup[1][userGroup[1].length - 1];
        userSvg.append("text")
            .attr("x", userXScale(new Date(lastDataPoint[0])) + 5)
            .attr("y", userYScale(lastDataPoint[1]) - 5)
            .text(userGroup[0])
            .style("font-size", "12px")
            .style("fill", colorScale(userGroup[0]));

        const userDots = userSvg.append("g")
            .attr("fill", colorScale(userGroup[0]));

        // Append circles (dots) to each user's group element
        userDots.selectAll("circle")
            .data(userGroup[1])
            .enter()
            .append("circle")
            .attr("cx", d => userXScale(new Date(d[0])))
            .attr("cy", d => userYScale(d[1]))
            .attr("r", 4)
            .on("mouseover", (event, d) => {
              tooltip.style("display", 'block')
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 10) + "px")
                  .html(Math.round(d[1]));
            })
            .on("mouseout", () => {
              tooltip.style('display', 'none');
            });
      });

},
    getData() {
      let csv = 'User;Description;Start date;Duration;Tags;\n' +
          'Florex;Meeting;10/06/2022;01:10:00;Meeting;\n' +
          'Hadi Tlais;Startmeeting;24/07/2022;00:30:00;;\n' +
          'Hadi Tlais;Dokument Zusammenfassung;28/07/2022;00:30:00;;\n' +
          'Hadi Tlais;Am Antrag gearbeitet;28/07/2022;01:00:00;;\n' +
          'Hadi Tlais;Erstes Dokument (Foto, Video, Audio);28/07/2022;02:30:00;;\n' +
          'Florex;Research and set Up Laravel with VueJS and Inertia;29/07/2022;05:00:00;;\n' +
          'Florex;Getting Tailwind to work;02/08/2022;00:57:00;;\n' +
          'Florex;Header Routing;02/08/2022;01:15:00;;\n' +
          'Florex;Authentication recherche;02/08/2022;00:35:10;;\n' +
          'Florex;Authentication;03/08/2022;01:30:48;;\n' +
          'Florex;Authentication;03/08/2022;00:05:00;;\n' +
          'Florex;Authentication;03/08/2022;00:37:25;;\n' +
          'Florex;Authentication;04/08/2022;00:36:49;;\n' +
          'Hadi Tlais;Statusmeeting;04/08/2022;01:00:00;;\n' +
          'Florex;Authentication;04/08/2022;00:39:52;;\n' +
          'Florex;Authentication;06/08/2022;01:14:20;;\n' +
          'Florex;Authentication;06/08/2022;00:08:59;;\n' +
          'Florex;Authentication;06/08/2022;00:22:34;;\n' +
          'Florex;Farben website;06/08/2022;01:06:26;;\n' +
          'Florex;Display Balance;06/08/2022;00:20:00;;\n' +
          'Florex;font;06/08/2022;00:23:00;;\n' +
          'Florex;Aufgaben hochladen;10/08/2022;00:12:00;;\n' +
          'Florex;Aufgaben hochladen;10/08/2022;01:57:35;;\n' +
          'Florex;Detail View of a Job;11/08/2022;01:04:00;;\n' +
          'Florex;User Permissions;12/08/2022;01:30:17;;\n' +
          'Florex;User Permissions;12/08/2022;00:20:00;;\n' +
          'Florex;User Permissions;12/08/2022;00:22:30;;\n' +
          'Hadi Tlais;Wordpress Dokument & Canon70D Bedienung;13/08/2022;03:00:00;;\n' +
          'Florex;Upload Form;13/08/2022;00:12:00;;\n' +
          'Hadi Tlais;Statusmeeting;13/08/2022;05:00:00;;\n' +
          'Martin;Jira erstellt;13/08/2022;01:00:00;;\n' +
          'Martin;Teams erstellt;13/08/2022;01:00:00;;\n' +
          'Florex;Upload Form;14/08/2022;01:00:00;;\n' +
          'Florex;Meeting;14/08/2022;00:37:55;;\n' +
          'Florex;Upload Form;14/08/2022;01:08:13;;\n' +
          'Florex;CAS-27 Website: Aufgaben verändern;18/08/2022;00:26:11;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;19/08/2022;01:05:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;19/08/2022;00:38:49;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;19/08/2022;00:10:23;;\n' +
          'Martin;Backlog erstellt;20/08/2022;01:00:00;;\n' +
          'Florex;Finding error after cloning from git;20/08/2022;01:11:00;;\n' +
          'Florex;Set up workspace on my laptop;21/08/2022;00:26:02;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;21/08/2022;00:49:31;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;21/08/2022;00:34:41;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;21/08/2022;00:02:33;;\n' +
          'Hadi Tlais;Regeln der Fotografie;21/08/2022;03:00:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;23/08/2022;00:24:55;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;23/08/2022;01:21:24;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;24/08/2022;00:36:36;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;25/08/2022;00:16:54;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;27/08/2022;01:10:13;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;27/08/2022;00:30:06;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;27/08/2022;00:36:57;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;30/08/2022;00:11:19;;\n' +
          'Martin;Aufgabe: Logodesign;30/08/2022;00:49:00;;\n' +
          'Hadi Tlais;Aufgabe Inserat, Regeln der Fotografie Korrektur;31/08/2022;02:00:00;;\n' +
          'Hadi Tlais;Statusmeeting;01/09/2022;00:30:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;01/09/2022;01:00:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;07/09/2022;00:15:06;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;07/09/2022;00:00:52;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;07/09/2022;00:17:44;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;08/09/2022;00:10:04;;\n' +
          'Florex;Meeting mit Nussbaumer;08/09/2022;00:35:00;;\n' +
          'Florex;Wordpress Cashew;09/09/2022;01:14:28;;\n' +
          'Martin;Meeting Nussbaumer;12/09/2022;01:15:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;12/09/2022;00:10:05;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;12/09/2022;00:10:03;;\n' +
          'Hadi Tlais;Aufgabe Fotostory;12/09/2022;01:30:00;;\n' +
          'Florex;CAS-26 Website: Deadlines erstellen;12/09/2022;00:15:05;;\n' +
          'Hadi Tlais;Meeting;12/09/2022;00:45:00;;\n' +
          'Martin;E-Mail an Easyname verfasst;15/09/2022;00:15:00;;\n' +
          'Martin;Projektauftrag bearbeitet;16/09/2022;00:36:00;;\n' +
          'Martin;Projektauftrag bearbeitet 2;16/09/2022;00:17:00;;\n' +
          'Martin;Diplomarbeitantrag;20/09/2022;02:37:52;;\n' +
          'Martin;Diplomarbeitantrag;21/09/2022;01:30:00;;\n' +
          'Martin;Diplomarbeitantrag;21/09/2022;02:32:00;;\n' +
          'Martin;Meeting Nussbaumer (Diplomarbeits Antrag);22/09/2022;01:02:00;;\n' +
          'Hadi Tlais;Am Antrag gearbeitet;22/09/2022;01:00:00;;\n' +
          'Martin;Diplomarbeitantrag überarbeitet;22/09/2022;02:19:48;;\n' +
          'Hadi Tlais;Mockup (Visitenkarte, Moodboard, Dokumentendeckblatt;02/10/2022;14:30:00;;\n' +
          'Hadi Tlais;Mockup (Beginn);02/10/2022;00:30:00;;\n' +
          'Martin;Diplomarbeitsantrag für Bundesschulen Datenbank ausgefüllt;02/10/2022;01:00:00;;\n' +
          'Florex;Besprechung Bayandor;03/10/2022;00:10:04;;\n' +
          'Martin;Bayandor Meeting;06/10/2022;01:10:00;Meeting;\n' +
          'Hadi Tlais;Meeting;06/10/2022;01:10:00;;\n' +
          'Florex;File Upload;08/10/2022;01:00:05;;\n' +
          'Hadi Tlais;Meeting;14/10/2022;01:00:00;;\n' +
          'Martin;Diplomarbeitsmeeting durchgeführt;14/10/2022;01:00:00;Meeting;\n' +
          'Martin;Dokument zur technischen Planung der Website erstellt;15/10/2022;02:00:00;;\n' +
          'Florex;Generierung Steuererklärung;17/10/2022;00:52:11;;\n' +
          'Martin;Plakat bearbeitet;19/10/2022;04:05:00;;\n' +
          'Florex;Categories;25/10/2022;01:02:00;;\n' +
          'Florex;Categories;28/10/2022;01:03:05;;\n' +
          'Florex;Categories;29/10/2022;01:48:38;;\n' +
          'Florex;Categories;30/10/2022;02:39:44;;\n' +
          'Martin;Jira für TOFT vorbereitet;02/11/2022;00:30:00;;\n' +
          'Florex;Admin Permissions;02/11/2022;01:12:09;;\n' +
          'Florex;Categories;06/11/2022;02:10:48;;\n' +
          'Florex;Work Page Design;08/11/2022;01:25:30;;\n' +
          'Florex;Work Page Design;10/11/2022;01:13:56;;\n' +
          'Hadi Tlais;Mockup (Startseite weiter);11/11/2022;02:00:00;;\n' +
          'Florex;Work Page Design;13/11/2022;01:35:23;;\n' +
          'Florex;Work Page Design;13/11/2022;00:43:28;;\n' +
          'Martin;Plakate fertiggestellt;13/11/2022;01:30:00;;\n' +
          'Hadi Tlais;CI bearbeiten;14/11/2022;02:00:00;;\n' +
          'Hadi Tlais;Mockup;14/11/2022;01:00:00;;\n' +
          'Martin;Auftrag Inserat für Toft vorbereitet;15/11/2022;02:00:00;;\n' +
          'Florex;Vorzeige Account erstellen;16/11/2022;01:04:00;;\n' +
          'Florex;ToDo Page Design;17/11/2022;00:27:00;;\n' +
          'Hadi Tlais;Steuererklärungen Quiz Vorbereitung;17/11/2022;02:00:00;;\n' +
          'Florex;Homepage;18/11/2022;01:45:00;;\n' +
          'Martin;Präsentation vorbereitet;28/11/2022;01:00:00;;\n' +
          'Hadi Tlais;Präsentation vorbereitet;04/12/2022;01:10:00;;\n' +
          'Florex;Homepage;04/12/2022;02:11:12;;\n' +
          'Florex;Warning Message;04/12/2022;01:49:00;;\n' +
          'Hadi Tlais;Meeting Präsentation;06/12/2022;01:00:00;;\n' +
          'Martin;Meeting gemacht;06/12/2022;01:00:00;Meeting;\n' +
          'Florex;Warning Message;11/12/2022;00:09:45;;\n' +
          'Florex;Guest Page;11/12/2022;00:09:49;;\n' +
          'Florex;Responsive text size;11/12/2022;00:52:00;;\n' +
          'Martin;Usability Tests vorbereitet;20/12/2022;01:00:00;;\n' +
          'Hadi Tlais;Usability Test;20/12/2022;01:00:00;;\n' +
          'Martin;Usability Tests durchgeführt;21/12/2022;01:14:14;;\n' +
          'Martin;Cashew Status-Meeting;23/12/2022;01:00:00;Meeting;\n' +
          'Martin;"Aufgabe ""Firmenlogo"" erstellt";26/12/2022;01:07:26;;\n' +
          'Martin;"Aufgabe ""Firmenlogo"" erweitert";26/12/2022;00:56:23;;\n' +
          'Martin;"Aufgabe ""Mockup"" erstellt";26/12/2022;01:58:00;;\n' +
          'Martin;"Aufgabe ""Typografie"" erstellt";27/12/2022;03:00:00;;\n' +
          'Hadi Tlais;Mockup weitergearbeitet (Schülerseite);27/12/2022;02:00:00;;\n' +
          'Martin;Cashew Status-Meeting;29/12/2022;01:00:00;Meeting;\n' +
          'Martin;"Aufgabe ""Drehbuch"" erstellt";04/01/2023;03:00:00;;\n' +
          'Hadi Tlais;Aufträge (Fotoserie, Fotostory);04/01/2023;02:00:00;;\n' +
          'Martin;"Aufgabe ""Animation"" erstellt";06/01/2023;03:29:00;;\n' +
          'Hadi Tlais;Aufträge (Videoschnitt, Videotechnik);06/01/2023;02:15:00;;\n' +
          'Martin;"Aufgabe ""Usability/Joy of Use"" erstellt";06/01/2023;04:57:00;;\n' +
          'Martin;"Aufgabe ""Typografie"" erweitert";07/01/2023;01:00:00;;\n' +
          'Hadi Tlais;Aufträge (Erklärungsvideos, StockFotos);07/01/2023;02:00:00;;\n' +
          'Martin;"Aufgabe ""Farbtheorie"" erstellt";08/01/2023;04:26:05;;\n' +
          'Hadi Tlais;Aufträge (Bildbearbeitung, Bildformate);08/01/2023;02:00:00;;\n' +
          'Martin;Design Aufträge mit Jerabek durchbesprochen;09/01/2023;00:29:00;;\n' +
          'Martin;Fotografie Aufträge verbessert;10/01/2023;01:00:00;;\n' +
          'Martin;Cashew Status-Meeting;14/01/2023;00:25:00;Meeting;\n' +
          'Florex;Detail Finished Job;14/01/2023;04:31:49;;\n' +
          'Hadi Tlais;Meeting (Zwischenstand, Zukunft?);19/01/2023;01:10:00;;\n' +
          'Martin;Datenbankeinträge für Aufträge geschrieben;19/01/2023;01:30:00;;\n' +
          'Martin;Cashew Status-Meeting;21/01/2023;00:30:00;Meeting;\n' +
          'Martin;Usability Tests durchgeführt (2AI);25/01/2023;01:11:00;;\n' +
          'Martin;Cashew Status-Meeting;28/01/2023;00:30:00;Meeting;\n' +
          'Martin;Cashew Status-Meeting;03/02/2023;00:25:00;Meeting;\n' +
          'Hadi Tlais;Probekapitel Anfang;03/02/2023;00:45:00;;\n' +
          'Hadi Tlais;Probekapitel (2.Versuch);04/02/2023;02:00:00;;\n' +
          'Martin;Design für Aufträge überarbeitet;06/02/2023;02:24:21;;\n' +
          'Martin;"Auftrag ""Animation"" überarbeitet";06/02/2023;01:02:00;;\n' +
          'Martin;"Auftrag ""Drehbuch"" überarbeitet";07/02/2023;00:46:34;;\n' +
          'Martin;"Auftrag ""Farbtheorie"" überarbeitet";07/02/2023;01:10:24;;\n' +
          'Martin;"Auftrag ""Firmenlogo"" überarbeitet";07/02/2023;01:00:00;;\n' +
          'Hadi Tlais;Mockup (Lehrerseite);08/02/2023;02:00:00;;\n' +
          'Florex;Search bar for teachers;08/02/2023;01:43:54;;\n' +
          'Martin;"Auftrag ""Inserat"" überarbeitet";08/02/2023;01:11:00;;\n' +
          'Martin;"Auftrag ""Mockup"" überarbeitet";08/02/2023;00:46:00;;\n' +
          'Florex;Homepage Lehrer;09/02/2023;04:15:54;;\n' +
          'Hadi Tlais;Mockup (Lehrerseite);09/02/2023;03:00:00;;\n' +
          'Martin;"Auftrag ""Typografie"" überarbeitet";09/02/2023;01:04:00;;\n' +
          'Hadi Tlais;Meeting;10/02/2023;00:30:00;;\n' +
          'Martin;"Auftrag ""Usability"" überarbeitet";10/02/2023;01:06:00;;\n' +
          'Florex;diplomarbeitsbuch;10/02/2023;01:37:06;;\n' +
          'Florex;Homepage Lehrer;11/02/2023;02:02:05;;\n' +
          'Hadi Tlais;Probekapitel 3.Versuch;11/02/2023;02:00:00;;\n' +
          'Martin;Diplomarbeitsbuch angefangen;11/02/2023;03:54:00;;\n' +
          'Florex;Homepage Lehrer;12/02/2023;01:20:12;;\n' +
          'Florex;Homepage Lehrer;12/02/2023;01:19:45;;\n' +
          'Florex;Homepage Lehrer;12/02/2023;02:01:18;;\n' +
          'Martin;Meeting mit Nussbaumer;16/02/2023;00:30:00;Meeting;\n' +
          'Martin;Cashew Status-Meeting;17/02/2023;00:25:00;Meeting;\n' +
          'Martin;Diplomarbeitsbuch in Word umgeschrieben;19/02/2023;01:00:00;;\n' +
          'Hadi Tlais;Diplomarbeitsbuch;20/02/2023;00:30:00;;\n' +
          'Martin;Diplomarbeitsbuch bearbeitet;20/02/2023;01:30:00;;\n' +
          'Hadi Tlais;Promotion (Prof. BUC, Prof. KUS);21/02/2023;01:20:00;;\n' +
          'Florex;Sortierung Todos;21/02/2023;00:30:00;;\n' +
          'Florex;Anzeigen des Kontostandes;21/02/2023;01:16:36;;\n' +
          'Martin;Diplomarbeitsbuch verbessert;22/02/2023;01:48:00;;\n' +
          'Florex;details von abgenommenem job anzeigen schüleransicht;23/02/2023;00:24:06;;\n' +
          'Florex;Automatische erstellung von PDFs;23/02/2023;00:09:00;;\n' +
          'Martin;Cashew Status-Meeting;24/02/2023;00:25:00;Meeting;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;25/02/2023;00:42:00;;\n' +
          'Florex;Automatische erstellung von PDFs;25/02/2023;00:37:04;;\n' +
          'Florex;Automatische erstellung von PDFs;25/02/2023;01:00:08;;\n' +
          'Florex;Automatische erstellung von PDFs;25/02/2023;00:56:05;;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;26/02/2023;03:28:00;;\n' +
          'Hadi Tlais;Promotion Bearbeitung;01/03/2023;00:30:00;;\n' +
          'Hadi Tlais;FAQ;01/03/2023;00:30:00;;\n' +
          'Florex;fsadas;03/03/2023;00:00:07;;\n' +
          'Martin;Cashew Status-Meeting;04/03/2023;00:30:00;Meeting;\n' +
          'Martin;Usability Test Conclusio;05/03/2023;00:31:00;;\n' +
          'Florex;Automatische erstellung von PDFs;07/03/2023;01:01:22;;\n' +
          'Florex;Automatische erstellung von PDFs;08/03/2023;00:20:00;;\n' +
          'Hadi Tlais;Meeting;08/03/2023;01:00:00;;\n' +
          'Florex;Automatische erstellung von PDFs;09/03/2023;01:20:00;;\n' +
          'Florex;Automatische erstellung von PDFs;09/03/2023;02:00:00;;\n' +
          'Florex;Automatische erstellung von PDFs;10/03/2023;00:40:18;;\n' +
          'Martin;Cashew Status-Meeting;11/03/2023;00:30:00;Meeting;\n' +
          'Hadi Tlais;Auftragsliste mit Aufträgen auffüllen;11/03/2023;02:00:00;;\n' +
          'Florex;Übersicht Schüler;12/03/2023;00:18:49;;\n' +
          'Hadi Tlais;Auftragsliste mit Aufträgen auffüllen;12/03/2023;03:00:00;;\n' +
          'Florex;Übersicht Schüler;12/03/2023;02:14:00;;\n' +
          'Florex;Übersicht Schüler;12/03/2023;01:16:00;;\n' +
          'Martin;Cashew Status-Meeting;18/03/2023;00:30:00;Meeting;\n' +
          'Hadi Tlais;Promotion & FAQ;18/03/2023;02:00:00;;\n' +
          'Florex;Übersicht Schüler;19/03/2023;01:12:00;;\n' +
          'Florex;Übersicht Schüler;19/03/2023;01:32:14;;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;19/03/2023;03:38:00;;\n' +
          'Florex;Übersicht Schüler;19/03/2023;00:49:55;;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;20/03/2023;01:36:00;;\n' +
          'Florex;Diplomarbeitsbuch;21/03/2023;00:32:00;;\n' +
          'Florex;Übersicht Schüler;22/03/2023;00:32:00;;\n' +
          'Florex;Uploading new site;22/03/2023;01:00:00;;\n' +
          'Hadi Tlais;DA Buch Vorbereitung Kapitel und Schreiben;23/03/2023;04:00:00;;\n' +
          'Martin;Cashew Währung designed;23/03/2023;00:30:10;;\n' +
          'Martin;Cashew Status-Meeting;24/03/2023;00:35:00;Meeting;\n' +
          'Hadi Tlais;DA Buch 1;24/03/2023;04:00:00;;\n' +
          'Florex;Diplomarbeitsbuch;25/03/2023;00:46:00;;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;25/03/2023;01:25:00;;\n' +
          'Hadi Tlais;DA Buch 2;25/03/2023;02:00:00;;\n' +
          'Martin;Produktpräsentation vorbereitet;26/03/2023;01:29:00;;\n' +
          'Hadi Tlais;DA Buch 3;26/03/2023;04:00:00;;\n' +
          'Florex;Minor Changes (Logo, Währung);26/03/2023;00:08:29;;\n' +
          'Florex;Minor Changes (Logo, Währung);26/03/2023;00:04:18;;\n' +
          'Florex;Minor Changes (Logo, Währung);26/03/2023;00:20:00;;\n' +
          'Florex;Minor Changes (Logo, Währung);26/03/2023;00:34:29;;\n' +
          'Hadi Tlais;Aufträge hinzufügen und bearbeiten;26/03/2023;03:00:00;;\n' +
          'Hadi Tlais;DA Präsentation Vorbereitung;27/03/2023;01:00:00;;\n' +
          'Florex;LandingPage;27/03/2023;01:58:00;;\n' +
          'Florex;kleine Änderungen vor Abnahme;27/03/2023;00:33:00;;\n' +
          'Florex;Präsentation;27/03/2023;02:47:00;;\n' +
          'Hadi Tlais;DA Präsentation Vorbereitung;27/03/2023;02:00:00;;\n' +
          'Martin;Produktpräsentation vorbereitet;27/03/2023;03:06:00;;\n' +
          'Martin;Diplomarbeitsbuch weitergeschrieben;28/03/2023;03:48:00;;\n' +
          'Martin;Produktpräsentation vorbereitet;28/03/2023;02:17:00;;\n' +
          'Hadi Tlais;DA Buch 3;28/03/2023;05:00:00;;\n' +
          'Hadi Tlais;DA Buch 4;29/03/2023;01:30:00;;\n' +
          'Florex;Steuererklärungen;29/03/2023;01:13:41;;\n' +
          'Martin;Auftragsliste fertiggestellt;29/03/2023;11:44:00;;\n' +
          'Florex;Steuererklärungen;29/03/2023;02:24:00;;\n' +
          'Florex;Steuererklärungen;30/03/2023;01:39:17;;\n' +
          'Florex;LandingPage;30/03/2023;00:31:06;;\n' +
          'Florex;Steuererklärungen;30/03/2023;01:01:00;;\n' +
          'Florex;Upload Jobs from CSV;30/03/2023;03:08:00;;\n' +
          'Martin;Dokumente für Abnahme fertiggestellt;30/03/2023;01:17:00;;\n' +
          'Martin;CI niedergeschrieben;30/03/2023;00:19:00;;\n' +
          'Florex;Diplomarbeitsbuch;30/03/2023;08:42:00;;';

      let lines = csv.split("\n");
      const headers = lines.shift().split(";")
      const jsonObj = [];
      for(let i = 1; i < lines.length; i++) {
        const data = lines[i].split(';');
        const obj = {};
        for(let j = 0; j < data.length; j++) {
          obj[headers[j]] = data[j].trim();
        }
        jsonObj.push(obj);
      }
      JSON.stringify(jsonObj);
      return jsonObj
    }
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

* {
  font-family: Helvetica, Arial, sans-serif;
}
</style>
