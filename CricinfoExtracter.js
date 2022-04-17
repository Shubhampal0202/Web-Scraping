// the purpose of this project is to extract information of worldcup 2019 from cricinfo and present
// that in the form of excel and pdf scorecards
// the real purpose is to learn how to extract information and get experience with js
// A very good reason to ever make a project is to have good fun

// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// node CricinfoExtracter.js --excel=Worldcup.csv --dataFolder=WorldCup --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results
 
// download using axios
// extract information using jsdom
// manipulate data using array functions
// save in excel using excel4node
// create folders and prepare pdfs


let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");


let args = minimist(process.argv);
//  console.log(args.excel);
//  console.log(args.dataFolder);
//  console.log(args.source);
axios.get(args.source).then(function (responce) {  // responce is a object
   let html = responce.data;
   //  console.log(html);
   let dom = new jsdom.JSDOM(html);
   let document = dom.window.document;
   let matches = [];

   let matchKaDivs = document.querySelectorAll(".match-info.match-info-FIXTURES");
   for (let i = 0; i < matchKaDivs.length; i++) {
      let matchdivs = matchKaDivs[i];
      let teams = matchdivs.querySelectorAll("p.name");
      // console.log(teams);
      let match = {

      };

      match.t1 = teams[0].textContent;
      match.t2 = teams[1].textContent;
      let teamScore = matchdivs.querySelectorAll(" .team .score");
      if (teamScore.length == 2) {
         match.t1Score = teamScore[0].textContent;
         match.t2Score = teamScore[1].textContent;
      }
      else if (teamScore.length == 1) {
         match.t1Score = teamScore[0].textContent;
         match.t2Score = "did not bat";
      }
      else {
         match.t1Score = "did not bat";
         match.t2Score = "did not bat";

      }
      let result = matchdivs.querySelector(".status-text span");
      match.result = result.textContent;
      matches.push(match);
      let matchesJSON = JSON.stringify(matches);
      fs.writeFileSync("matchesjson",matchesJSON,"utf-8");

   }
   let teamsArray = [];
   for (let i = 0; i < matches.length; i++) {
      putTeamsInteamArrayIfmissing(teamsArray, matches[i]);
   }
   for (let i = 0; i < matches.length; i++) {
      putMatchInappropriteTeam(teamsArray, matches[i]);
   }
   let teamJSON = JSON.stringify(teamsArray);
   fs.writeFileSync("teams.json",teamJSON,"utf-8");

 CreateExcelFile(teamsArray);
 Createfolders(teamsArray);


}).catch(function (err) {
  
   console.log(err);
})

 function Createfolders(teamsArray){
    fs.mkdirSync(args.dataFolder);
    for(let i=0;i<teamsArray.length;i++){
       let teamFn = path.join(args.dataFolder,teamsArray[i].name);
       fs.mkdirSync(teamFn);
       for(let j=0;j<teamsArray[i].matches.length;j++){
          let matchFileName = path.join(teamFn,teamsArray[i].matches[j].vs + ".pdf");
         fs.writeFileSync(matchFileName, " ", "utf-8")
          CreateScorecard(teamsArray[i].name, teamsArray[i].matches[j], matchFileName);
       }
    }
 }

function CreateExcelFile(teamsArray){
   let wb = new excel.Workbook();
   for(let i=0;i<teamsArray.length;i++){
     let workSheet =  wb.addWorksheet(teamsArray[i].name);
     workSheet.cell(1,1).string("VS");
     workSheet.cell(1,2).string("SelfScore");
     workSheet.cell(1,3).string("Opp.Score");
     workSheet.cell(1,4).string("Result");
     for(let j=0;j<teamsArray[i].matches.length;j++){
        let vs = teamsArray[i].matches[j].vs;
        let team1score = teamsArray[i].matches[j].SelfScore;
        let team2score = teamsArray[i].matches[j].opponantScore;
        let result = teamsArray[i].matches[j].result;
        workSheet.cell(2+j,1).string(vs);
        workSheet.cell(2+j,2).string(team1score);
        workSheet.cell(2+j,3).string(team2score);
        workSheet.cell(2+j,4).string(result);
     }
   }
   wb.write(args.excel);
}

function CreateScorecard(teamName,match,matchFile){
  let t1 = teamName;
  let t2 = match.vs;
  let t1S = match.SelfScore;
  let t2S = match.opponantScore;
  let result = match.result;
  let originalBytes = fs.readFileSync("template-converted.pdf");
  let pdfdocKapromice = pdf.PDFDocument.load(originalBytes);
  pdfdocKapromice.then(function(pdfDoc){
     let page = pdfDoc.getPage(0);
     page.drawText(t1,{
        x:320,
        y:670,
        size:9
     });

     page.drawText(t2,{
      x:320,
      y:650,
      size:9
   });

   page.drawText(t1S,{
      x:320,
      y:630,
      size:9
   });

   page.drawText(t2S,{
      x:320,
      y:608,
      size:9
   });

   page.drawText(result,{
      x:320,
      y:590,
      size:9
   });

    let FinalBytesKaPromice = pdfDoc.save();
    FinalBytesKaPromice.then(function(finalPdfBytes){
       fs.writeFileSync(matchFile,finalPdfBytes);
    })
  })
}

function putTeamsInteamArrayIfmissing(teamsArray, match) {
   let indx = -1;
   for (let i = 0; i < teamsArray.length; i++) {
      if (teamsArray[i].name == match.t1) {
         indx = i;
         break;
      }
   }

   if (indx == -1) {
      teamsArray.push({
         name: match.t1,
         matches: []
      })
   }


   let indx2 = -1;
   for (let i = 0; i < teamsArray.length; i++) {
      if (teamsArray[i].name == match.t2) {
         indx2 = i;
         break;
      }
   }

   if (indx2 == -1) {
      teamsArray.push({
         name: match.t2,
         matches: []
      })
   }
}

function putMatchInappropriteTeam(teamsArray, match) {
   let indx = -1;
   for (let i = 0; i < teamsArray.length; i++) {
      if (teamsArray[i].name == match.t1) {
         indx = i;
         break;
      }
   }

   let team1 = teamsArray[indx];
   team1.matches.push({
      vs: match.t2,
      SelfScore: match.t1Score,
      opponantScore: match.t2Score,
      result: match.result
   });

   let indx2 = -1;
   for (let i = 0; i < teamsArray.length; i++) {
      if (teamsArray[i].name == match.t2) {
         indx2 = i;
         break;
      }
   }

   let team2 = teamsArray[indx2];
   team2.matches.push({
      vs: match.t1,
      SelfScore: match.t2Score,
      opponantScore: match.t1Score,
      result: match.result
   })
}










