const apiKey = "AIzaSyDuDbI6ohJuNT06swLhpgc6ADkKe03sYYY"

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const data = await response.json()
  if (data.models) {
    console.log(data.models.map(m => m.name).join('\n'))
  } else {
    console.log(data)
  }
}

test()
