// poland
sys.include("lib/centrum24.js");
sys.include("config.js");

var b = null;

function sms_callback(data) {
	sys.sleep(1000); // 1 secs
	sys.log("Fetching SMS code for "+data["data"]["Money_Bank_Withdraw__"]+"...");
	var x = sys.signedPost("https://www.mtgox.com/api/1/generic/bank/centrum24_get_sms_code", "withdraw_id="+data["data"]["Money_Bank_Withdraw__"], api_key, api_secret);
	x = JSON.parse(x);
	if (x["return"]) {
		sys.log("Got SMS code: "+x["return"]);
		return x["return"];
	}
	for(i = 0; i < 30; i++) {
		sys.sleep(1000); // 1 secs
		sys.log("Retrying...");
		x = sys.signedPost("https://www.mtgox.com/api/1/generic/bank/centrum24_get_sms_code", "withdraw_id="+data["data"]["Money_Bank_Withdraw__"], api_key, api_secret);
		x = JSON.parse(x);
		if (x["return"]) {
			sys.log("Got SMS code: "+x["return"]);
			return x["return"];
		}
	}
	return false;
}

while(true) {
	var res = sys.signedPost("https://www.mtgox.com/api/1/generic/bank/withdraw_pull", "bank=fe2e074d-e127-42fb-bdd2-9b729029b313&currency=EUR&small_first=0&limit_day=1", api_key, api_secret);
	res = JSON.parse(res);
	if (res.result != "success") {
		sys.log(JSON.stringify(res));
		sys.abort();
	}
	if (!b) {
		b = new centrum24();
		b.login(centrum_nik, centrum_password);
	}

	sys.log(JSON.stringify(res["return"]));
	if ( (res["return"]["meta"]["swift"].substr(0,4) == "CITI") || (res["return"]["meta"]["swift"].substr(0,4) == "IPBS") ) {
		tx_success = {error: "Transfer to CITIBANK - avoid processing to avoid funds blocked", trx: res["return"]};
		sys.signedPost("https://www.mtgox.com/api/1/generic/bank/withdraw_pull_res", "bank=fe2e074d-e127-42fb-bdd2-9b729029b313&json="+encodeURIComponent(JSON.stringify(tx_success)), api_key, api_secret);
		continue;
	}
	var tx_success = b.processSwift(res["return"], sms_callback);
	if (!tx_success) {
		tx_success = {error: "No SEPA route", trx: res["return"]};
		sys.signedPost("https://www.mtgox.com/api/1/generic/bank/withdraw_pull_res", "bank=fe2e074d-e127-42fb-bdd2-9b729029b313&json="+encodeURIComponent(JSON.stringify(tx_success)), api_key, api_secret);
		continue;
	}
	tx_success.trx = res["return"];
	sys.signedPost("https://www.mtgox.com/api/1/generic/bank/withdraw_pull_res", "bank=fe2e074d-e127-42fb-bdd2-9b729029b313&json="+encodeURIComponent(JSON.stringify(tx_success)), api_key, api_secret);
}

if (b) b.logout();

