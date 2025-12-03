# **App Name**: Railway Logger

## Core Features:

- Discord Bot Integration: Connects to Discord and listens for log request commands.
- Railway API Connection: Communicates with the Railway GraphQL API to fetch logs using API tokens.
- Log Retrieval: Retrieves logs from specified Railway services based on service ID.
- Deployment Log Extraction: Extracts logs associated with the latest deployment.
- Log Formatting and Display: Formats the log messages and displays them in a readable format within Discord, taking care not to exceed discord's limits, by offering latest lines only.
- Command Handling: Accepts commands such as `!logs deploy` to fetch logs for specific scenarios. Apply admin control tool when accessing the logs.

## Style Guidelines:

- Primary color: Dark blue (#2E3148) for a professional and calm feel.
- Background color: Very dark desaturated blue (#21222D) to provide contrast without distraction.
- Accent color: Electric purple (#BE5BFF) to highlight interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif, will give a neutral look to the logs.
- Simple, clear icons for different log types (deploy, app) to quickly differentiate log sources.
- Clean and organized layout for log display to ensure readability and ease of navigation.
- Subtle animations when fetching and displaying logs to provide feedback without being distracting.