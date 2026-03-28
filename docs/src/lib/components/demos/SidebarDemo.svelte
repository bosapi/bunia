<script lang="ts">
    import {
        Sidebar, SidebarHeader, SidebarContent,
        SidebarGroup, SidebarMenu, SidebarMenuItem,
        SidebarFooter,
    } from "$registry/sidebar";
</script>

<div class="w-full rounded-lg border overflow-hidden" style="height: 360px;">
    <div class="flex h-full">
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div class="flex items-center gap-2">
                    <img src="/logo-dark.svg" alt="Bosia" class="hidden h-5 w-5 dark:block" />
                    <img src="/logo-light.svg" alt="Bosia" class="block h-5 w-5 dark:hidden" />
                    <span class="text-lg font-bold">Bosia</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup label="Navigation">
                    <SidebarMenu>
                        <SidebarMenuItem href="#" label="Home" active />
                        <SidebarMenuItem href="#" label="Dashboard" />
                        <SidebarMenuItem href="#" label="Settings" />
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup label="Analytics">
                    <SidebarMenu>
                        <SidebarMenuItem label="Reports">
                            <SidebarMenuItem href="#" label="Overview" />
                            <SidebarMenuItem href="#" label="Monthly" />
                        </SidebarMenuItem>
                        <SidebarMenuItem href="#" label="Exports" />
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <p class="text-xs text-muted-foreground">v0.1.0</p>
            </SidebarFooter>
        </Sidebar>

        <main class="flex-1 p-6 bg-background">
            <p class="text-sm text-muted-foreground">Main content area. Click the toggle button to collapse the sidebar.</p>
        </main>
    </div>
</div>
