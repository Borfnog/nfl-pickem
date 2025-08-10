# NFL Pick-Em Web Game

This repository contains a client-side NFL Pick‑Em game built with plain HTML, CSS and JavaScript. It allows players to select winners for each game in a given schedule, track their picks and see a leaderboard of results once games have been scored.

## Features

- **Weekly picks**: Renders weeks and games from a provided schedule file. Players click to select winners for each matchup and provide a tiebreaker score.
- **Locking weeks**: Each week can be locked at a specified kickoff time to prevent changes after games start.
- **Admin mode**: A hidden admin panel allows an administrator to upload a schedule, edit games, set winners and update results once games have been played.
- **Leaderboard**: Displays players’ total correct picks and optional tiebreaker difference to compare performance.
- **Import/Export**: Picks are stored in localStorage for persistence. Players can export their picks as a JSON file and share them. Those picks can be imported by others.
- **Fully client‑side**: The app runs entirely in the browser. There is no server or NFL API integration; schedule data must be provided manually.

## Using the App

1. Clone or download this repository.
2. Open `index.html` in a modern web browser. The default schedule contained in `script.js` will be loaded automatically.
3. Click each game to select your pick for the winner and enter a tiebreaker guess for the Monday night game.
4. To administer the game (edit schedule, set winners, save results), click the **Admin** button. The default passphrase is `letmein`. You can then import a custom schedule or export and import results.

### Schedule and Results JSON Format

The schedule is defined in a JSON object with a `weeks` array. Each week has a `name`, an optional ISO‑208601 `lockTime`, and an array of `games`. Each game entry must have:

- `id`: unique identifier across all games.
- `home`: name of the home team.
- `away`: name of the away team.

Results are stored as an object with `results` keyed by game `id` and containing the `winner` string (matching `home` or `away`) and optional `homeScore`/`awayScore` for the tiebreaker.

Example:

```
{
  "weeks": [
    {
      "name": "Week 1",
      "lockTime": "2024-09-05T23:00:00Z",
      "games": [
        { "id": 1, "home": "Chiefs", "away": "Lions" },
        { "id": 2, "home": "Bills", "away": "Jets" }
      ]
    }
  ],
  "results": {
    "1": { "winner": "Lions", "homeScore": 21, "awayScore": 28 },
    "2": { "winner": "Jets", "homeScore": 16, "awayScore": 20 }
  }
}
```

## Customising

The provided `script.js` includes a `defaultSchedule` variable where you can define your own schedule. To run the game with real NFL matchups, update the weeks and games arrays. Use the admin panel to populate results as the season progresses.

---

This repository is a simple demonstration. Feel free to fork and enhance it with user authentication, API-driven schedules, or hosting on a backend of your choice.
