const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById("searchBtn").addEventListener("click", async () => {
  const name = document.getElementById("searchName").value;
  const color = document.getElementById("searchColor").value;

  let query = client.from("cards").select("*");

  if (name) {
    query = query.ilike("名称", `%${name}%`);
  }

  if (color) {
    query = query.eq("色", color);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  renderCards(data);
});

function renderCards(cards) {
  const result = document.getElementById("result");
  result.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h2>${card.名称}</h2>
      <p>色：${card.色}</p>
      <p>レアリティ：${card.レアリティ}</p>
      <p>レベル：${card.レベル}</p>
      <p>パワー：${card.パワー}</p>
      <p>${card.ルールテキスト}</p>
      <p>${card.検索タグ}</p>
    `;

    result.appendChild(div);
  });
}
