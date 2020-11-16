interface LoggedIn {
  type: "LoggedIn"
  contents: {
    access_token: string,
    expires_in: number,
    id_token: string,
    refresh_token: string,
    token_type: string
  }
}

interface NotLoggedIn { type: "NotLoggedIn" }

type User = LoggedIn | NotLoggedIn
type Scope = "phone" | "email" | "openid" | "profile" | "aws.cognito.signin.user.admin"

type Model =
  { authenticationDomain: string,
    client_id: string,
    userPoolId: string
    ssoSites: string,
    redirectURI: string,
    scopes: Scope[]
  }

function defaultModel(): Model{
  const port = (document.location.port === "80" || document.location.port === "443" || document.location.port === "") ? "" : (":" + document.location.port)
  const redirectURI = document.location.protocol + "//" + document.location.hostname + port
  return ({
    authenticationDomain: "",
    client_id: "",
    userPoolId: "",
    ssoSites: "",
    redirectURI,
    scopes: [ "email", "phone", "openid", "profile" ]
  })
}
function getModel(): Model {
  try{
    const result = localStorage.getItem("model")
    if(result === null ) return defaultModel()
    const json = JSON.parse(result)
    if(!json.scopes) json.scopes = defaultModel().scopes
    return json
  } catch(e){
    console.error("There was an error parsing the value returned from localStorage", e)
    return defaultModel()
  }
}

function setModel(model: Model){
  localStorage.setItem("model", JSON.stringify(model))
}

function defaultUser(): User{
  return ({ type: "NotLoggedIn"} )
}
function getUser(): User {
  try{
    const result = localStorage.getItem("user")
    if(result === null ) return defaultUser()
    else return JSON.parse(result)
  } catch(e){
    console.error("There was an error parsing the value returned from localStorage", e)
    return defaultUser()
  }
}

function setUser(user: User){
  localStorage.setItem("user", JSON.stringify(user))
}

function addScope(scope: Scope, checked: boolean){
  return function(){
    const user = getUser()
    const model = getModel()
    let scopes = model.scopes.filter(s => s !== scope)
    if(!checked) scopes = scopes.concat([scope])
    model.scopes = scopes
    setModel(model)
    applyModel(model, user) 
    applyUser(model, user)
  }
}

const makeScopes = ({ scopes } : Model) => {
  const scopesEl = document.getElementById("scopes");
  if(scopesEl) scopesEl.innerHTML = ""
  const allScopes: Scope[] = ["phone", "email", "openid", "aws.cognito.signin.user.admin", "profile"]
  allScopes.forEach( (scope: Scope) => {
    const checked = scopes.indexOf(scope) >= 0
    const scopeButton =  document.createElement("input")
    scopeButton.setAttribute("type", "checkbox")
    //@ts-ignore
    scopeButton.addEventListener('click', addScope(scope, checked))
    if(checked) scopeButton.setAttribute("checked", "true")
    const scopeLabel = document.createElement("span")
    scopeLabel.innerText = scope
    const scopeSpan = document.createElement("span")
    scopeSpan.setAttribute("class", "scope")
    scopeSpan.appendChild(scopeButton)
    scopeSpan.appendChild(scopeLabel)
    scopesEl?.appendChild(scopeSpan)
  })
}

const makeSitesHTML = ({ ssoSites }: Model, user: User) => {
  if(user.type == "LoggedIn"){
    const sites = ssoSites.split(",").map(str => str.trim())
    const sitesEl = document.getElementById("sites")
    if(sitesEl){ sitesEl.innerHTML = ""}
    sites.forEach(site => {
      const anchor = document.createElement("a")
      anchor.setAttribute("href", site)
      anchor.innerText = site;
      sitesEl?.appendChild(anchor)
    })
  }
}

function makeNotLoggedInHTML(model: Model){
  const anchor = document.createElement("a")

  const href = "https://" + model.authenticationDomain + 
    `/login?client_id=${model.client_id}&response_type=code&scope=${model.scopes.join("+")}&redirect_uri=${model.redirectURI}`
  anchor.setAttribute("href", href)
  anchor.innerText = "Login"

  const userEl = document.getElementById("user")
  if(userEl){
    userEl.innerHTML = ""
    userEl.setAttribute("class", "user loginButton")
    userEl.appendChild(anchor)
  }
}

function jsonTable(obj: { [key:string]: any}): Element {

  function makeRow(label: string, value: string): Element {
    const tr = document.createElement("tr")
    const labelCell = document.createElement("td")
    labelCell.innerText = label
    const valueCell = document.createElement("td")
    valueCell.innerText = value
    tr.appendChild(labelCell)
    tr.appendChild(valueCell)
    return tr
  }

  const table =  document.createElement("table")
  const tbody = document.createElement("tbody")
  Object.keys(obj).forEach(key => {
    const value: any = obj[key];
    const str = (typeof value === "string") ? value : value.toString()
    tbody.appendChild(makeRow(key, str)) 
  })
  table.appendChild(tbody)

  const div = document.createElement("div")
  div.setAttribute("class", "table")
  div.appendChild(table)

  return div
}

function makeSectionText(name: string, text: string): Element[] {
    const h2 = document.createElement("h2")
    h2.innerText = name
    const p = document.createElement("p")
    p.setAttribute("class", "section-text")
    p.innerText = text
    return [h2, p]
}

function makeLoggedInHTML(model: Model, user: LoggedIn){
  model; user;
  
  const anchor = document.createElement("a")
  anchor.addEventListener("click", (e) => {
    e.preventDefault()
    console.log("Click!")
    localStorage.removeItem("user")
    applyUser(model, defaultUser())
  })
  anchor.setAttribute("href", "")
  anchor.innerText = "Logout"



  document.getElementById("user")
  const userEl = document.getElementById("user")
  if(userEl){
    userEl.innerHTML = ""
    userEl.appendChild(anchor)

    makeSectionText("Credentials", "These are the credentials returned by the OAuth process")
      .forEach(el => userEl.appendChild(el))
    userEl.appendChild(jsonTable(user.contents))

    try{
      const [part0, part1] = user.contents.id_token.split(".")
      const decoded0 = atob(part0)
      const decoded1 = atob(part1)
      
      makeSectionText("id_token part 0", "I've base64 decoded the different parts of the id_token, for convenience")
        .forEach(el => userEl.appendChild(el))
      userEl.appendChild(jsonTable(JSON.parse(decoded0)))

      makeSectionText("id_token part 1", "I've base64 decoded the different parts of the id_token, for convenience")
      userEl.appendChild(jsonTable(JSON.parse(decoded1)))

    }catch(e){
      console.error("Error decoding id_token", e)
    }
  }
}

function makeUserHTML(model: Model, user: User): void{
  switch(user.type){
    case "NotLoggedIn": return makeNotLoggedInHTML(model)
    case "LoggedIn": return makeLoggedInHTML(model, user) 
  }
}

function handleInputEvent<K extends keyof Model>(key: K){
  return function(){
    const model = getModel()
    const user = getUser()
    const el = document.getElementById(key)
    const value = (el as HTMLInputElement).value
    if(value && key !== "scopes"){
      //@ts-ignore
      model[key] = value
      setModel(model)
      applyModel(model, user)
    }
  }
}

function setField<K extends keyof Model>(key: K, value: string){
  const field = document.getElementById(key)
  if(field) (field as HTMLInputElement).value =  value
}

function setFields(model: Model){
  setField("authenticationDomain", model.authenticationDomain)
  setField("userPoolId", model.userPoolId)
  setField("client_id", model.client_id)
  setField("ssoSites", model.ssoSites)
  setField("redirectURI", model.redirectURI)
}

function attachEventListener<K extends keyof Model>(key: K){
  const field = document.getElementById(key)
  field?.addEventListener("input", handleInputEvent(key))
}

function attachEventListeners(){
  attachEventListener("authenticationDomain")
  attachEventListener("client_id")
  attachEventListener("userPoolId")
  attachEventListener("ssoSites")
  attachEventListener("redirectURI")
}

function applyModel(model: Model, user: User){
  setFields(model)
  makeScopes(model)
  makeSitesHTML(model, user)
}

function applyUser(model: Model, user: User){
  makeUserHTML(model, user)
}

function getToken(code: string, model: Model): Promise<User>{
  const url = `https://${model.authenticationDomain}/oauth2/token`
  const body = `grant_type=authorization_code&client_id=${model.client_id}&code=${code}&redirect_uri=${model.redirectURI}`;
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  return fetch(url, { method: "POST", body, headers })
            .then(response => response.json())
            .then(contents => ({ type: "LoggedIn", contents }))
}

function handleCode(model: Model){
  const url = new URL(document.location.href)
  const code = url.searchParams.get("code")
  if(code){
    getToken(code, model).then(user => {
      const port = (document.location.port === "80" || document.location.port === "443" || document.location.port === "") ? "" : (":" + document.location.port)
      const thisUrl = document.location.protocol + "//" + document.location.hostname + port
      console.log(thisUrl)
      console.log(history.replaceState({}, '', thisUrl))
      setUser(user)
      const latestModel = getModel()
      applyModel(latestModel, user)
      applyUser(latestModel, user)
    })
  }
}

(function (){
  const model = getModel()
  const user = getUser()
  attachEventListeners()
  applyModel(model, user)
  applyUser(model, user)
  handleCode(model)
})()