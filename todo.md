The Problem: How to handle patch. The response might be different from the patch. XML response for a JSON patch. From what I can tell via the spec this should be allowable by a server. The server should know how to interpret json patch on its own without any reference from the response schema.

The current system reflects the idea that we just stick with a submission style merge patch, and that we consider them completely separate representations. This is probably for the best for now, but causes schema duplication. Maybe we require merge patch to accept a non-merge-patch representation, and it extracts some extra validation data?


TODO:
1. Finish the merge patch as a standalone, fully duplicated representation system
2. Create the post patch representation class, fully duplicating everything. Don't stress about the duplication
3. See if there is a way to optimize from here. Stop attempting to pre-optimize this flow
4. Unit tests