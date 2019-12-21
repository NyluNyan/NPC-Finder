const fs = require('fs'),
path = require('path');

module.exports = function NPC_Finder(mod) {
	
	let IDs = require('./config.json'),
	MarkId = 88888888,
	Markers = [],
	hooks = [];
	
	mod.command.add(['nf'], (cmd, zone, id, name) =>
	{
		switch(cmd)
		{
			case undefined:
				if(hooks[0] === undefined)
				{
					hooks.push(mod.hook('S_SPAWN_NPC', 11, (event) => {
						var i = IDs.indexOf(event.templateId);
						if(i != -1)
						{
							if(IDs[i-1] == event.huntingZoneId)
							{
								Markers.push(event.gameId, MarkId++);
								SpawnMarker(MarkId-1, event.loc);
								mod.command.message('Found ' + IDs[i+1]);
							}
						}
					}));
					hooks.push(mod.hook('S_DESPAWN_NPC', 3, (event) => {
							var i = Markers.indexOf(event.gameId);
							if(i !== -1) ClearMarker(i);
					}));
					mod.command.message('NPC markers enabled');
				}
				else
				{
					mod.unhook(hooks[0]);
					mod.unhook(hooks[1]);
					hooks = [];
					var x = Markers.length/2;
					for(i = 0; i < x; i++) ClearAllMarks(0);
					mod.command.message('NPC markers disabled');
				}
				break;
			case 'help':
				mod.command.message('type list to see the current IDs in ToolBox console, add followed by huntingZoneId templateId "name/description", rem huntingZoneId templateId or the name (case insensitive)');
				break;
			case 'add':
				if(Number(zone) != NaN && Number(id) != NaN && typeof name == 'string')
				{
					IDs.push(Number(zone), Number(id), name);
					mod.command.message('Added ' + name + ' to search list with zone ' + zone + ' and ID ' + id);
				}
				else mod.command.message('invalid input, type add followed by huntingZoneId templateId "name/description"');
				break;
			case 'rem':
				var i = IDs.indexOf(Number(id));
				if(i !== -1)
				{
					if(IDs[i-1] === Number(zone))
					{
						mod.command.message('Removed ' + IDs[i+1] + ' from ID list');
						IDs.splice(i-1, 3);
					}
					else mod.command.message('incorrect zone ID specified');
				}
				else if(isNaN(zone))
				{
					var TID = [];
					for(i = 2; i < IDs.length; i += 3) TID.push(IDs[i].toLowerCase());
					i = TID.indexOf(zone.toLowerCase());
					if(i !== -1)
					{
						i*=3;
						mod.command.message('Removed ' + IDs[i+2] + ' from ID list');
						IDs.splice(i, 3);
					}
					else mod.command.message('Name not found, type list to see current IDs in ToolBox console');
				}
				else mod.command.message('ID not found, type list to see current IDs in ToolBox console');
				break;
			case 'list':
				mod.log(IDs);
				break;
		}
		if(['add', 'rem'].includes(cmd))
		{
			fs.writeFile(path.join(__dirname, 'config.json'), (JSON.stringify(IDs, null, 2)), err => {
				if(err) return;
			});
		}
	});
	
	mod.game.on('enter_loading_screen', () => {
		ClearAllMarks();
    });
	
	function SpawnMarker(ID, Loc)
	{
		Loc.z -= 100;
		mod.toClient('S_SPAWN_DROPITEM', 8, {
		gameId: ID,
		loc: Loc,
		item: 98260,
		amount: 1,
		expiry: 999999,
		owners: [{playerId: mod.game.me.playerId}]
		});
	}
	
	function ClearMarker(Index)
	{
		mod.toClient('S_DESPAWN_DROPITEM', 4, {
        gameId: Markers[Index + 1]
		});
		Markers.splice(Index, 2);
	}
	
	function ClearAllMarks()
	{
		var x = Markers.length/2;
		if(x) for(i = 0; i < x; i++) ClearMarker(0);
	}
}