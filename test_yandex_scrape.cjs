const https = require("https");

const cookies = [
  "yandexuid=6744050391767902254",
  "yashr=6683940251768149843",
  "_ym_uid=1768149867668852163",
  "gdpr=0",
  "L=YFVqenlBe1NQcWIHVUh8AwVeZAxjBgZXE1wjHjQsB1dSBhl2eF5m.1768320010.1600835.326001.279fb37583d805fdf0aa71ef5268ad49",
  "yandex_login=andreyradin2012",
  "_ym_d=1768492640",
  "amcuid=3886465041769245537",
  "skid=93651991769874543",
  "alice_uuid=1D507A31-068F-4DFF-8410-13AE2A5765D7",
  "my=YwA=",
  "i=cqm/WzPwx/TxJVYhW//o04UmJboDcZZuZ7NwY+7SuF+shrg01thQthnz7TIhD66ibHgC+4OLHbs6uPrul5Aume8leto=",
  "360-utm=from=win_telemost_autologin",
  "Session_id=3:1770909689.5.0.1768320010957:KDibsg:4ce1.1.2:1|161655272.0.2.3:1768320010|3:11710648.689763.ywlDagUyJwDv5eGhPsEdeR2n22U",
  "sessar=1.1615350.CiAq2NPryZyOZ-Nbvjg3CHnhanTczHlF43S0ljoUIABVQQ.4UwGquUtNFyG6pPMZ5n2cZugC9sZsqUl7d4-erE4bpo",
  "sessionid2=3:1770909689.5.0.1768320010957:KDibsg:4ce1.1.2:1|161655272.0.2.3:1768320010|3:11710648.689763.fakesign0000000000000000000",
  "yabs-vdrf=LQezfE03oFbm1QOzf7022Tja1puHfRm2SMDi1ZOHfsW1KhTi1ytvf7G1Nmze1yNvfE00iGrW07tvf702B5za1t6nfTm2ANN41kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1kcjfSW0dDMK1k",
  "is_gdpr=0",
  "is_gdpr_b=CMzOaRCV9AIoAg==",
  "isa=r/CQbOdBdic224uOkAWGSqeuyMO+RSlxp1fhR5HifQbazvyWnePyipbRQCcMaMJa8wCJOmQEyUSaBOPzgGO9GemsinM=",
  "sae=0:1D507A31-068F-4DFF-8410-13AE2A5765D7:p:25.12.4.1198:w:d:RU:20260108",
  "cycada=455KZmB/rgNptOj5kgQx2xhg19Hhv8VR8O0p8zfgO4Q=",
  "_ym_isad=2",
  "ymex=2086518434.yrts.1771158434",
  "funtech-lang=ru-ru",
  "_ym_visorc=b",
  "_csrf=9BLMSy7b1GT071B6hz-_SgA6",
  "s=bookmate.ec84bb0",
  "_ymab_param=IT5bRCiLoMpZfuFVcLAcY8aI9sKJmlCyoVc6knH0JDr4pVPcljQmmKTwbutCy6TkPvXvv-DbJozrDyhS1qqMNPvegUY",
  "b-prev-page=/",
  "gpauto=48_707069:44_516979:100000:3:1771160633",
  "yp=1771226033.uc.ru#1771226033.duc.ru#1802694432.brd.0702004923#1802694432.cld.2270452#1772946059.hdrc.1#2086520652.pcs.1#1802696652.swntab.0#1800036588.dc_neuro.10#2083680010.udn.cDrQkNC90LTRgNC10Lkg0KDQsNC00LjQvQ%3D%3D#1800028646.sp.shst%3A1#1772551836.gph.225_118#1786321795.szm.1%3A1920x1080%3A1904x896%3A15#1771692515.dlp.1#1771167833.gpauto.48_707069%3A44_516979%3A100000%3A3%3A1771160633",
  "ys=def_bro.1#ead.C5C8A923#wprid.1771160655776995-4503466691912346760-balancer-l7leveler-kubr-yp-sas-51-BAL#ybzcc.ru#newsca.native_cache",
  "_yasc=z2WeQccQ4tgdFxSgY75FYFzM1ooCABFA0tCtY+TDL+DnSy3F/aeqmdGGktrqemDJXWawo2Sl4P2MS2FVLhFinC0=",
  "bh=YNaIx8wGaivcyv3sCqnSo90C+ta2gwLr/52rBPrWoqUPhuTx5w3r//32D8PVyqcO9/MB",
].join("; ");

const options = {
  hostname: "books.yandex.ru",
  path: "/search?text=Harry",
  method: "GET",
  headers: {
    Cookie: cookies,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    // Check for "hydration" data or book titles
    console.log(
      'Includes "Harry":',
      data.includes("Harry") ||
        data.includes("Potter") ||
        data.includes("Гарри"),
    );
    console.log("BODY SAMPLE:", data.substring(0, 1000));
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
