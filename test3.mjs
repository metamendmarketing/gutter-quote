const apiKey = "AIzaSyDuDbI6ohJuNT06swLhpgc6ADkKe03sYYY"

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const data = await response.json()
  console.log(JSON.stringify(data, null, 2))
}

test()
