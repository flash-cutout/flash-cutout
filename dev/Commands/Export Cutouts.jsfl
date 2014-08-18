function run(name)
{
	var path = [FLfile.read(fl.scriptURI.replace(/[^\/]+$/, 'Cutout.ini')).replace(/\/*$/, '/')];
	for (var i in path)
	{
			var uri = path[i] + name + ".jsfl";
			if (FLfile.exists(uri))
			{
				//fl.trace("Loading "+uri+"...");
				fl.runScript(uri);
				return;
			}
	}
	fl.trace("No module named '"+ name +"'found in:\n\t" + path.join("\n\t"));
}

run("Cutout");
