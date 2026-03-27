<script lang="ts">
    import { Avatar, AvatarFallback } from "$registry/avatar";
</script>

<div class="flex items-center gap-4">
    <Avatar src="https://github.com/shadcn.png" alt="shadcn">
        <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    <Avatar>
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <Avatar class="h-16 w-16">
        <AvatarFallback>LG</AvatarFallback>
    </Avatar>
</div>
