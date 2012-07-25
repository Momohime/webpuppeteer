// poland
sys.include("lib/centrum24.js");
sys.include("config.js");

var b = null;

while(true) {
	var res = sys.signedPost("https://mtgox.com/api/1/generic/bank/centrum24_pull", "currency=EUR", api_key, api_secret);
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
	var tx_success = b.processSwift(res["return"]);
	tx_success.trx = res["return"];
	sys.signedPost("https://mtgox.com/api/1/generic/bank/centrum24_pull_res", "json="+encodeURIComponent(JSON.stringify(tx_success)), api_key, api_secret);
}

if (b) b.logout();
