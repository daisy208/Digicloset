# Privacy Policy (Draft)

This project handles user data for the purposes of authentication and virtual try-on services.
- We store only the minimum personal data required (email, hashed password, non-identifying preferences).
- Images uploaded for try-on are retained for 30 days by default and then deleted, unless the user opts-in for longer retention.
- We use Supabase as a managed data store. Access controls and backups should be configured by owners.
- For production, enable encryption at rest and in transit and document data retention/erasure flows.